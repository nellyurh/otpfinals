# UltraCloud SMS - Complete Deployment Guide

## Table of Contents
1. [Security Features](#security-features)
2. [Architecture Overview](#architecture-overview)
3. [Environment Variables](#environment-variables)
4. [Docker Setup](#docker-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [Cloudflare Setup](#cloudflare-setup)
7. [GitHub Actions CI/CD](#github-actions-cicd)
8. [Step-by-Step Deployment](#step-by-step-deployment)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Troubleshooting](#troubleshooting)

---

## 1. Security Features

### 1.1 Seed Endpoint Protection

**Before (VULNERABLE):**
```
GET /api/seed-database
# Anyone could access and see admin credentials!
```

**After (SECURE):**
```
POST /api/seed-database
Headers: X-Seed-Secret: your-secret-here
# Returns success without exposing credentials
```

**How to use:**
```bash
# Set the secret in your .env
SEED_SECRET=my-super-secret-seed-key-12345

# Call the endpoint (one-time setup)
curl -X POST https://getucloudy.com/api/seed-database \
  -H "Content-Type: application/json" \
  -H "X-Seed-Secret: my-super-secret-seed-key-12345"
```

---

### 1.2 CORS (Cross-Origin Resource Sharing)

**Before (VULNERABLE):**
```python
allow_origins=["*"]
allow_credentials=True
# This combination is dangerous and browsers may block it
```

**After (SECURE):**
```python
allow_origins=[
    "https://getucloudy.com",
    "https://www.getucloudy.com",
    "http://localhost:3000",  # Development only
]
allow_credentials=True
```

**Why it matters:**
- Prevents other websites from making API calls on behalf of your users
- Protects against CSRF attacks
- Browsers enforce this - misconfigurations can break your app

**To customize:**
```bash
# In .env file
CORS_ORIGINS=https://getucloudy.com,https://www.getucloudy.com,https://admin.getucloudy.com
```

---

### 1.3 API Key Encryption at Rest

**How it works:**

```
User enters key in Admin Panel
         ↓
    encrypt_secret("ps_sk_live_xxx")
         ↓
    Stored in MongoDB as: "ENC:gAAA...encrypted..."
         ↓
    When making API call:
         ↓
    decrypt_secret("ENC:gAAA...")
         ↓
    Original key: "ps_sk_live_xxx"
```

**Encryption method:** Fernet (AES-128-CBC with HMAC)

**If database is stolen:**
- Attacker sees: `ENC:gAAAAABl2...long-encrypted-string...`
- Without `SECRETS_MASTER_KEY`, they CANNOT decrypt
- Your payment gateway keys remain safe

**Generate a master key:**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
# Output: dGhpcyBpcyBhIHNhbXBsZSBrZXkgZm9yIGRlbW8=
```

**Encrypted fields:**
- `daisysms_api_key`
- `smspool_api_key`
- `fivesim_api_key`
- `paymentpoint_api_key`
- `paymentpoint_secret`
- `ercaspay_secret_key`
- `payscribe_api_key`
- `payscribe_public_key`
- `plisio_secret_key`
- `reloadly_client_secret`

---

### 1.4 Audit Logging

**What gets logged:**
```json
{
  "id": "uuid",
  "user_id": "admin-user-id",
  "action": "update_api_keys",
  "details": {
    "keys_updated": ["payscribe_api_key", "payscribe_public_key"],
    "ip_address": "102.89.xx.xx",
    "admin_email": "admin@smsrelay.com"
  },
  "timestamp": "2026-01-22T12:00:00Z"
}
```

**View audit logs (MongoDB):**
```javascript
db.audit_logs.find().sort({timestamp: -1}).limit(10)
```

---

## 2. Architecture Overview

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (SSL + CDN)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Contabo VPS    │
                    │  (Static IP)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │     ┌────────▼────────┐
     │     Nginx      │     │     │    MongoDB      │
     │  (Port 80/443) │     │     │  (Port 27017)   │
     └────────┬───────┘     │     └─────────────────┘
              │             │              ▲
     ┌────────┴────────┐    │              │
     │                 │    │              │
┌────▼────┐      ┌─────▼────▼─┐            │
│Frontend │      │  Backend   │────────────┘
│ (React) │      │ (FastAPI)  │
│Port 3000│      │ Port 8001  │
└─────────┘      └────────────┘
```

**Traffic flow:**
1. User visits `https://getucloudy.com`
2. Cloudflare terminates SSL, proxies to your VPS
3. Nginx receives request on port 80
4. Nginx routes:
   - `/api/*` → Backend (port 8001)
   - `/*` → Frontend (port 3000)
5. Backend connects to MongoDB (port 27017)

---

## 3. Environment Variables

### Required Variables

```bash
# ============ SECURITY (Required) ============
# Random 32+ character string for JWT tokens
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

# Fernet key for encrypting API keys in database
# Generate: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
SECRETS_MASTER_KEY=dGhpcyBpcyBhIHNhbXBsZSBrZXkgZm9yIGRlbW8=

# Secret to protect the seed endpoint
SEED_SECRET=my-seed-secret-change-this

# ============ DATABASE ============
# Docker internal network URL
MONGO_URL=mongodb://mongodb:27017
DB_NAME=sms_relay_db

# ============ CORS ============
# Comma-separated list of allowed origins
CORS_ORIGINS=https://getucloudy.com,https://www.getucloudy.com

# ============ OPTIONAL (Set via Admin Panel) ============
# These can be set in Admin Panel instead of .env
# PAYSCRIBE_API_KEY=ps_sk_live_xxx
# PAYSCRIBE_PUBLIC_KEY=ps_pk_live_xxx
# ERCASPAY_SECRET_KEY=xxx
# etc...
```

### Where to set them:

| Variable | docker-compose.yml | .env file | Admin Panel |
|----------|-------------------|-----------|-------------|
| JWT_SECRET | ✅ | ✅ | ❌ |
| SECRETS_MASTER_KEY | ✅ | ✅ | ❌ |
| SEED_SECRET | ✅ | ✅ | ❌ |
| MONGO_URL | ✅ | ✅ | ❌ |
| CORS_ORIGINS | ✅ | ✅ | ❌ |
| PAYSCRIBE_API_KEY | ⚠️ Optional | ⚠️ Optional | ✅ Recommended |
| Payment Keys | ⚠️ Optional | ⚠️ Optional | ✅ Recommended |

---

## 4. Docker Setup

### 4.1 docker-compose.yml Explained

```yaml
version: '3.8'

services:
  # ============ MongoDB ============
  mongodb:
    image: mongo:6.0                    # Official MongoDB image
    container_name: ultracloud-mongodb
    restart: always                     # Auto-restart on crash
    ports:
      - "127.0.0.1:27017:27017"        # Only accessible from localhost!
    volumes:
      - mongodb_data:/data/db          # Persist data between restarts
    healthcheck:                        # Check if MongoDB is ready
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # ============ Backend ============
  backend:
    build:
      context: ./backend               # Build from ./backend/Dockerfile
      dockerfile: Dockerfile
    container_name: ultracloud-backend
    restart: always
    ports:
      - "127.0.0.1:8001:8001"         # Only localhost, Nginx will proxy
    depends_on:
      mongodb:
        condition: service_healthy     # Wait for MongoDB to be ready
    environment:                       # Pass environment variables
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=sms_relay_db
      - JWT_SECRET=${JWT_SECRET}
      - SECRETS_MASTER_KEY=${SECRETS_MASTER_KEY}
      - SEED_SECRET=${SEED_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}

  # ============ Frontend ============
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_BACKEND_URL=https://getucloudy.com  # Baked into build
    container_name: ultracloud-frontend
    restart: always
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - backend

  # ============ Nginx ============
  nginx:
    image: nginx:alpine
    container_name: ultracloud-nginx
    restart: always
    ports:
      - "80:80"                        # Public HTTP
      - "443:443"                      # Public HTTPS (if not using Cloudflare)
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

### 4.2 Useful Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f              # All services
docker compose logs -f backend      # Backend only

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose build --no-cache backend
docker compose up -d

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes database!)
docker compose down -v

# Enter a container
docker exec -it ultracloud-backend bash
docker exec -it ultracloud-mongodb mongosh

# Check resource usage
docker stats
```

---

## 5. Nginx Configuration

### 5.1 Key Sections Explained

```nginx
# Rate limiting - prevent API abuse
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
# 10 requests per second per IP, burst up to 20

# API routes
location /api/ {
    limit_req zone=api burst=20 nodelay;  # Apply rate limit
    
    proxy_pass http://backend;             # Forward to backend container
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;  # Pass real client IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Webhook routes - NO rate limiting (payment providers need instant access)
location ~ ^/api/(ercaspay|payscribe|plisio)/webhook {
    proxy_pass http://backend;
    # No limit_req here!
}

# Frontend - serve React app
location / {
    proxy_pass http://frontend;
}
```

### 5.2 SSL with Cloudflare (Recommended)

When using Cloudflare:
- Cloudflare handles SSL termination
- Your server receives HTTP on port 80
- Set Cloudflare SSL mode to "Full (strict)"

```
User → HTTPS → Cloudflare → HTTP → Your VPS → Nginx → App
```

### 5.3 SSL without Cloudflare (Direct)

If not using Cloudflare, get certificate with Let's Encrypt:

```bash
# Stop nginx temporarily
docker compose stop nginx

# Get certificate
certbot certonly --standalone -d getucloudy.com -d www.getucloudy.com

# Certificates saved to:
# /etc/letsencrypt/live/getucloudy.com/fullchain.pem
# /etc/letsencrypt/live/getucloudy.com/privkey.pem

# Copy to nginx ssl folder
cp -r /etc/letsencrypt/live/getucloudy.com /opt/ultracloud/nginx/ssl/

# Uncomment HTTPS server block in nginx.conf
# Start nginx
docker compose start nginx
```

---

## 6. Cloudflare Setup

### 6.1 DNS Records

```
Type    Name    Content              Proxy
A       @       YOUR_VPS_IP          Proxied (orange)
A       www     YOUR_VPS_IP          Proxied (orange)
CNAME   api     getucloudy.com       Proxied (orange)
```

### 6.2 SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full (strict)**

### 6.3 Firewall Rules (Optional but Recommended)

Block direct access to your VPS (only allow Cloudflare IPs):

```
# On your VPS
ufw allow from 173.245.48.0/20 to any port 80
ufw allow from 103.21.244.0/22 to any port 80
# ... add all Cloudflare IP ranges
# See: https://www.cloudflare.com/ips/
```

### 6.4 Page Rules

Create a rule to always use HTTPS:
- URL: `http://*getucloudy.com/*`
- Setting: Always Use HTTPS

---

## 7. GitHub Actions CI/CD

### 7.1 How It Works

```
┌─────────────────┐
│  You push code  │
│   to GitHub     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│   triggered     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SSH into VPS   │
│  Run commands   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git pull       │
│  docker build   │
│  docker up      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ New version     │
│    LIVE!        │
└─────────────────┘
```

### 7.2 Setting Up GitHub Secrets

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VPS_HOST` | Your VPS IP address | `123.45.67.89` |
| `VPS_USERNAME` | SSH username | `root` or `deploy` |
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH...` |
| `VPS_PORT` | SSH port (optional) | `22` |

### 7.3 Generate SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-deploy"
# Saves to ~/.ssh/id_ed25519

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@YOUR_VPS_IP

# Copy private key content to GitHub secret
cat ~/.ssh/id_ed25519
# Copy entire output including BEGIN and END lines
```

### 7.4 Manual Deployment Trigger

Go to: **GitHub Repo** → **Actions** → **Deploy to Contabo VPS** → **Run workflow**

---

## 8. Step-by-Step Deployment

### 8.1 Prepare Your Contabo VPS

1. **Order a VPS** from Contabo (recommend VPS S or higher)
   - Ubuntu 22.04 LTS
   - At least 2 CPU, 4GB RAM, 50GB SSD

2. **SSH into your VPS**
```bash
ssh root@YOUR_VPS_IP
```

3. **Update system**
```bash
apt update && apt upgrade -y
```

### 8.2 Run Setup Script

```bash
# Download and run setup script
wget -O setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy.sh
chmod +x setup.sh
./setup.sh
```

**What the script does:**
1. Installs Docker & Docker Compose
2. Clones your repository
3. Generates secure secrets
4. Creates `.env` file
5. Builds and starts containers
6. Runs database seed

### 8.3 Configure DNS

1. Go to your domain registrar
2. Point `getucloudy.com` to your VPS IP
3. If using Cloudflare, add A record and enable proxy

### 8.4 Whitelist Server IP

For Payscribe and other payment providers:

1. Find your server's outbound IP:
```bash
curl ifconfig.me
```

2. Add this IP to:
   - Payscribe Dashboard → Settings → IP Whitelist
   - Other payment provider dashboards as needed

### 8.5 First Login

1. Visit `https://getucloudy.com`
2. Login with:
   - Email: `admin@smsrelay.com`
   - Password: `admin123`
3. **IMMEDIATELY** change your password!
4. Go to Admin Panel → configure your payment gateways

---

## 9. Post-Deployment Tasks

### 9.1 Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set strong `SECRETS_MASTER_KEY`
- [ ] Verified CORS is working (test from browser console)
- [ ] Whitelisted server IP in payment providers
- [ ] Set up firewall (only allow 80, 443, 22)
- [ ] Disabled root SSH login (use regular user + sudo)
- [ ] Set up fail2ban for SSH brute force protection

### 9.2 Backup Strategy

**MongoDB backup:**
```bash
# Manual backup
docker exec ultracloud-mongodb mongodump --out /backup
docker cp ultracloud-mongodb:/backup ./mongo-backup-$(date +%Y%m%d)

# Automated daily backup (add to crontab)
0 3 * * * /opt/ultracloud/backup.sh
```

**Create backup.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec ultracloud-mongodb mongodump --archive=/tmp/backup.gz --gzip
docker cp ultracloud-mongodb:/tmp/backup.gz $BACKUP_DIR/mongodb_$DATE.gz
# Keep only last 7 days
find $BACKUP_DIR -name "mongodb_*.gz" -mtime +7 -delete
```

### 9.3 Monitoring

**Check service health:**
```bash
# All services
docker compose ps

# Backend logs
docker compose logs -f backend --tail=100

# MongoDB logs
docker compose logs -f mongodb --tail=100

# Nginx access logs
docker compose logs -f nginx --tail=100
```

**Simple uptime monitoring:**
```bash
# Add to crontab (checks every 5 minutes)
*/5 * * * * curl -sf https://getucloudy.com/api/health || echo "Site down!" | mail -s "Alert" your@email.com
```

---

## 10. Troubleshooting

### 10.1 Common Issues

**Issue: 502 Bad Gateway**
```bash
# Check if backend is running
docker compose ps
docker compose logs backend --tail=50

# Restart backend
docker compose restart backend
```

**Issue: Database connection failed**
```bash
# Check MongoDB
docker compose logs mongodb --tail=50

# Enter MongoDB container
docker exec -it ultracloud-mongodb mongosh

# Check data directory permissions
ls -la /var/lib/docker/volumes/ultracloud_mongodb_data/
```

**Issue: Payment gateway returning 403**
```bash
# Check your outbound IP
curl ifconfig.me

# Make sure this IP is whitelisted in payment dashboard
```

**Issue: CORS errors in browser**
```bash
# Check CORS_ORIGINS in .env
# Restart backend after changing
docker compose restart backend
```

**Issue: SSL certificate errors**
```bash
# If using Let's Encrypt directly
certbot renew --dry-run

# Check certificate expiry
openssl s_client -connect getucloudy.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 10.2 Useful Commands

```bash
# View real-time logs
docker compose logs -f

# Check container resource usage
docker stats

# Restart everything
docker compose down && docker compose up -d

# Full rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Check what's listening on ports
netstat -tlnp

# Test API endpoint
curl -v https://getucloudy.com/api/health

# Check MongoDB data
docker exec -it ultracloud-mongodb mongosh
> use sms_relay_db
> db.users.find().limit(1)
```

### 10.3 Getting Help

1. Check logs first: `docker compose logs -f`
2. Search error message online
3. Check GitHub Issues on your repo
4. Contact support with:
   - Error message
   - Relevant logs
   - Steps to reproduce

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                    QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────┤
│ Domain:        https://getucloudy.com                   │
│ Admin Panel:   https://getucloudy.com → Login → Admin   │
│                                                         │
│ SSH Access:    ssh root@YOUR_VPS_IP                    │
│ App Directory: /opt/ultracloud                         │
│                                                         │
│ COMMANDS:                                               │
│ Start:         docker compose up -d                     │
│ Stop:          docker compose down                      │
│ Logs:          docker compose logs -f backend           │
│ Rebuild:       docker compose build --no-cache          │
│ Restart:       docker compose restart backend           │
│                                                         │
│ PORTS:                                                  │
│ 80/443:        Nginx (public)                          │
│ 8001:          Backend (internal)                      │
│ 3000:          Frontend (internal)                     │
│ 27017:         MongoDB (internal)                      │
│                                                         │
│ IMPORTANT FILES:                                        │
│ .env           Environment variables                    │
│ docker-compose.yml  Service definitions                 │
│ nginx/nginx.conf    Reverse proxy config               │
└─────────────────────────────────────────────────────────┘
```

---

*Last updated: January 2026*
*UltraCloud SMS - getucloudy.com*
