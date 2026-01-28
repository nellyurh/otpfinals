# Deployment Guide for socialsmsworld.com

**Server IP:** 178.18.247.113  
**Domain:** socialsmsworld.com

---

## 📦 Banner Carousel Specifications

**Recommended Banner Size:** `800 x 300 pixels` (aspect ratio ~2.67:1)

| Device | Display Height | Notes |
|--------|---------------|-------|
| Mobile | 128px (h-32) | Full width |
| Tablet | 160px (h-40) | Full width |
| Desktop | 192px (h-48) | Full width |

**Banner Format:** PNG, JPG, or WebP  
**Max File Size:** 2MB per banner

---

## 🚀 Step 1: Prepare Your VPS (SSH into 178.18.247.113)

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

---

## 📁 Step 2: Clone/Upload Your App

```bash
# Create app directory
mkdir -p /opt/socialsmsworld
cd /opt/socialsmsworld

# Option A: Clone from git (if you have a repo)
# git clone YOUR_REPO_URL .

# Option B: Upload via SFTP/SCP from your local machine
# scp -r /path/to/app/* root@178.18.247.113:/opt/socialsmsworld/
```

---

## ⚙️ Step 3: Configure Environment Variables

```bash
cd /opt/socialsmsworld

# Create .env file for Docker Compose
cat > .env << 'EOF'
JWT_SECRET=your_secure_jwt_secret_here_32chars
SECRETS_MASTER_KEY=your_secure_master_key_here
SEED_SECRET=your_secure_seed_secret_here
EOF

# Generate secure secrets (run these and copy output to .env)
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "SECRETS_MASTER_KEY=$(openssl rand -hex 32)"
echo "SEED_SECRET=$(openssl rand -hex 16)"
```

---

## 📝 Step 4: Update docker-compose.yml for socialsmsworld.com

Create/update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: socialsms-mongodb
    restart: always
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=sms_relay_db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: socialsms-backend
    restart: always
    ports:
      - "127.0.0.1:8001:8001"
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=sms_relay_db
      - JWT_SECRET=${JWT_SECRET}
      - SECRETS_MASTER_KEY=${SECRETS_MASTER_KEY}
      - SEED_SECRET=${SEED_SECRET}
      - CORS_ORIGINS=https://socialsmsworld.com,https://www.socialsmsworld.com
      - REACT_APP_BACKEND_URL=https://socialsmsworld.com
    volumes:
      - backend_uploads:/app/uploads
    healthcheck:
      test: curl -f http://localhost:8001/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_BACKEND_URL=https://socialsmsworld.com
    container_name: socialsms-frontend
    restart: always
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: socialsms-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend

  # Certbot for SSL (Let's Encrypt) - Optional if using Cloudflare
  certbot:
    image: certbot/certbot
    container_name: socialsms-certbot
    volumes:
      - certbot_data:/var/www/certbot
      - ./nginx/ssl:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  mongodb_data:
  certbot_data:
  backend_uploads:
```

---

## 🌐 Step 5: Configure Nginx for socialsmsworld.com

Create `nginx/nginx.conf`:

```bash
mkdir -p nginx/ssl
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream servers
    upstream backend {
        server backend:8001;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP - redirect to HTTPS
    server {
        listen 80;
        server_name socialsmsworld.com www.socialsmsworld.com;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect all HTTP to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS - Main domain
    server {
        listen 443 ssl http2;
        server_name socialsmsworld.com www.socialsmsworld.com;

        # SSL Certificate (Cloudflare Origin or Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/cloudflare.crt;
        ssl_certificate_key /etc/nginx/ssl/cloudflare.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Webhook routes - no rate limiting
        location ~ ^/api/(ercaspay|payscribe|plisio|paymentpoint)/webhook {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes - proxy to backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Frontend - proxy to React app
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
```

---

## 🔐 Step 6: SSL Certificate Setup (Choose One)

### Option A: Cloudflare Origin Certificate (Recommended)

1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate for `socialsmsworld.com` and `*.socialsmsworld.com`
3. Copy the certificate and key to your server:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Paste your Cloudflare Origin Certificate
cat > nginx/ssl/cloudflare.crt << 'EOF'
-----BEGIN CERTIFICATE-----
YOUR_CLOUDFLARE_ORIGIN_CERTIFICATE_HERE
-----END CERTIFICATE-----
EOF

# Paste your Cloudflare Private Key
cat > nginx/ssl/cloudflare.key << 'EOF'
-----BEGIN PRIVATE KEY-----
YOUR_CLOUDFLARE_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
EOF

chmod 600 nginx/ssl/cloudflare.key
```

4. In Cloudflare DNS, add:
   - Type: A, Name: @, Value: 178.18.247.113, Proxy: ON (orange cloud)
   - Type: A, Name: www, Value: 178.18.247.113, Proxy: ON

5. In Cloudflare SSL/TLS settings:
   - Set SSL mode to "Full (strict)"

### Option B: Let's Encrypt (Free)

```bash
# First, update nginx.conf to NOT require SSL initially
# Then run:
docker compose up -d nginx

# Get certificate
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d socialsmsworld.com -d www.socialsmsworld.com

# Update nginx.conf to use Let's Encrypt certs:
# ssl_certificate /etc/letsencrypt/live/socialsmsworld.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/socialsmsworld.com/privkey.pem;

docker compose restart nginx
```

---

## 🚀 Step 7: Build and Deploy

```bash
cd /opt/socialsmsworld

# Build and start all services
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

---

## ✅ Step 8: Verify Deployment

```bash
# Check backend health
curl -s http://localhost:8001/health

# Check frontend
curl -s http://localhost:3000 | head -20

# Check via domain (after DNS propagates)
curl -s https://socialsmsworld.com/api/health
```

---

## 🔄 Step 9: Maintenance Commands

```bash
# Restart all services
docker compose restart

# Rebuild and restart a specific service
docker compose build backend --no-cache
docker compose up -d backend

# View logs
docker compose logs -f --tail=100

# Stop all services
docker compose down

# Full rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Database backup
docker exec socialsms-mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# Check disk usage
docker system df
docker system prune -a  # Clean up unused images/containers
```

---

## 🔒 Firewall Setup (UFW)

```bash
# Enable firewall
ufw enable

# Allow SSH (important!)
ufw allow 22

# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443

# Block direct access to internal ports
ufw deny 8001
ufw deny 3000
ufw deny 27017

# Check status
ufw status
```

---

## 📊 Quick Reference

| Service | Internal Port | External Access |
|---------|--------------|-----------------|
| MongoDB | 27017 | Not exposed |
| Backend | 8001 | Via /api/* |
| Frontend | 3000 | Via / |
| Nginx | 80, 443 | Public |

| URL | Purpose |
|-----|---------|
| https://socialsmsworld.com | Frontend |
| https://socialsmsworld.com/api/health | Backend Health |
| https://socialsmsworld.com/api/auth/login | Login API |

---

## ⚠️ Troubleshooting

```bash
# If containers fail to start
docker compose logs backend  # Check for errors
docker compose logs mongodb  # Check DB connection

# If frontend shows blank page
docker compose logs frontend
docker compose exec frontend cat /var/log/nginx/error.log

# If API returns 502
docker compose restart backend
docker compose logs backend -f

# Reset everything
docker compose down -v  # WARNING: This deletes database!
docker compose up -d
```

---

## 📱 Post-Deployment: Admin Setup

1. Register a new admin account at https://socialsmsworld.com/register
2. SSH into server and promote to admin:

```bash
docker exec -it socialsms-mongodb mongosh sms_relay_db

# In mongo shell:
db.users.updateOne(
  { email: "your-admin@email.com" },
  { $set: { is_admin: true } }
)
```

3. Log into Admin Panel and configure:
   - Brand name and logo
   - Payscribe API keys
   - Payment gateway settings
   - Banner images (800x300px recommended)

---

**Deployment Complete!** 🎉

Your app should now be live at https://socialsmsworld.com
