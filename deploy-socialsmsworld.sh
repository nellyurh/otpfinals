#!/bin/bash
# =============================================
# socialsmsworld.com — Fresh Server Deployment
# Server IP: 158.220.101.16
# =============================================
#
# BEFORE running this script:
#   1. Point DNS: socialsmsworld.com + www.socialsmsworld.com → 158.220.101.16
#   2. Upload the entire project folder to /opt/socialsmsworld on the server
#   3. SSH into the server: ssh root@158.220.101.16
#   4. Run: cd /opt/socialsmsworld && chmod +x deploy-socialsmsworld.sh && sudo ./deploy-socialsmsworld.sh
#
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="socialsmsworld.com"
APP_DIR=$(pwd)
EMAIL="admin@socialsmsworld.com"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   socialsmsworld.com — VPS Deployment     ║"
echo "║   Server: 158.220.101.16                  ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo ./deploy-socialsmsworld.sh)${NC}"
    exit 1
fi

# ── Step 1: System Update ──
echo -e "\n${YELLOW}[1/9] Updating system...${NC}"
apt update && apt upgrade -y

# ── Step 2: Install Docker ──
echo -e "\n${YELLOW}[2/9] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# ── Step 3: Docker Compose ──
echo -e "\n${YELLOW}[3/9] Installing Docker Compose...${NC}"
apt install -y docker-compose-plugin curl
echo -e "${GREEN}✓ Docker Compose ready${NC}"

# ── Step 4: Firewall ──
echo -e "\n${YELLOW}[4/9] Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured (SSH + HTTP + HTTPS)${NC}"

# ── Step 5: Generate secrets ──
echo -e "\n${YELLOW}[5/9] Generating security keys...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    SECRETS_MASTER_KEY=$(openssl rand -base64 32)
    SEED_SECRET=$(openssl rand -hex 16)

    cat > "$APP_DIR/.env" << EOF
JWT_SECRET=$JWT_SECRET
SECRETS_MASTER_KEY=$SECRETS_MASTER_KEY
SEED_SECRET=$SEED_SECRET
EOF
    echo -e "${GREEN}✓ Security keys generated (.env created)${NC}"
else
    echo -e "${GREEN}✓ Using existing .env${NC}"
fi

# ── Step 6: Use socialsmsworld configs ──
echo -e "\n${YELLOW}[6/9] Setting up socialsmsworld.com configuration...${NC}"
# Copy the socialsmsworld docker-compose
cp docker-compose.socialsmsworld.yml docker-compose.yml
# Use the HTTP-only nginx config first (for Let's Encrypt challenge)
cp nginx/nginx.socialsmsworld.http-only.conf nginx/nginx.conf
echo -e "${GREEN}✓ Configs set for socialsmsworld.com (HTTP-only mode for SSL setup)${NC}"

# ── Step 7: Build & start (HTTP only) ──
echo -e "\n${YELLOW}[7/9] Building and starting containers (HTTP mode)...${NC}"
docker compose build --no-cache
docker compose up -d

echo -e "${YELLOW}Waiting 30s for services to start...${NC}"
sleep 30

# Health check
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed — check logs: docker compose logs backend${NC}"
fi

# ── Step 8: SSL with Let's Encrypt ──
echo -e "\n${YELLOW}[8/9] Obtaining Let's Encrypt SSL certificate...${NC}"
echo -e "${YELLOW}Make sure DNS for ${DOMAIN} and www.${DOMAIN} points to 158.220.101.16${NC}"
read -p "Press ENTER when DNS is ready (or Ctrl+C to skip SSL for now)..."

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained!${NC}"

    # Switch to full HTTPS nginx config
    cat > nginx/nginx.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream backend {
        server backend:8001;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name socialsmsworld.com www.socialsmsworld.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name socialsmsworld.com www.socialsmsworld.com;

        ssl_certificate /etc/letsencrypt/live/socialsmsworld.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/socialsmsworld.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        location ~ ^/api/(ercaspay|payscribe|plisio|paymentpoint)/webhook {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

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
NGINXEOF

    # Restart nginx with HTTPS
    docker compose restart nginx
    echo -e "${GREEN}✓ Nginx restarted with HTTPS${NC}"
else
    echo -e "${RED}✗ SSL failed — site will run on HTTP only. Run SSL step manually later.${NC}"
fi

# ── Step 9: Seed database ──
echo -e "\n${YELLOW}[9/9] Seeding database...${NC}"
SEED_SECRET=$(grep SEED_SECRET "$APP_DIR/.env" | cut -d '=' -f2)
curl -s -X POST http://localhost:8001/api/seed-database \
    -H "Content-Type: application/json" \
    -H "X-Seed-Secret: $SEED_SECRET" || echo "Seed may have already run"

# ── Setup auto-renewal cron ──
echo -e "\n${YELLOW}Setting up SSL auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 3 * * * cd $APP_DIR && docker compose run --rm certbot renew && docker compose restart nginx") | crontab -
echo -e "${GREEN}✓ SSL auto-renewal cron added (daily at 3am)${NC}"

# ── Setup daily backup cron ──
mkdir -p /opt/backups
(crontab -l 2>/dev/null; echo "0 4 * * * docker exec socialsms-mongodb mongodump --archive=/tmp/backup.gz --gzip && docker cp socialsms-mongodb:/tmp/backup.gz /opt/backups/mongodb_\$(date +\%Y\%m\%d).gz && find /opt/backups -name 'mongodb_*.gz' -mtime +7 -delete") | crontab -
echo -e "${GREEN}✓ Daily MongoDB backup cron added (4am, keeps 7 days)${NC}"

# ── Done ──
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║           DEPLOYMENT COMPLETE!                        ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  Domain:    https://socialsmsworld.com                ║"
echo "║  Server:    158.220.101.16                            ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  NEXT STEPS:                                          ║"
echo "║  1. Visit https://socialsmsworld.com                  ║"
echo "║  2. Register admin account                            ║"
echo "║  3. Promote to admin (see below)                      ║"
echo "║  4. Configure API keys in Admin Panel                 ║"
echo "║  5. Set Payscribe webhook secret in Admin             ║"
echo "║  6. Whitelist 158.220.101.16 in Payscribe dashboard  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Promote admin:${NC}"
echo '  docker exec -it socialsms-mongodb mongosh sms_relay_db'
echo '  db.users.updateOne({email:"YOUR_EMAIL"},{$set:{is_admin:true}})'
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker compose logs -f            # All logs"
echo "  docker compose logs -f backend    # Backend logs"
echo "  docker compose restart            # Restart all"
echo "  docker compose down && docker compose up -d  # Full restart"
echo ""
