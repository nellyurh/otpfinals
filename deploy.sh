#!/bin/bash

# UltraCloud SMS - Contabo VPS Setup Script
# Domain: getucloudy.com
# 
# Run this script on a fresh Ubuntu 22.04 VPS:
# wget -O setup.sh https://raw.githubusercontent.com/YOUR_REPO/main/deploy.sh && chmod +x setup.sh && sudo ./setup.sh

set -e

echo "=========================================="
echo "UltraCloud SMS - VPS Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./deploy.sh)${NC}"
    exit 1
fi

# Configuration
DOMAIN="getucloudy.com"
APP_DIR="/opt/ultracloud"
GITHUB_REPO="YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"  # UPDATE THIS!

echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose-plugin
fi

echo -e "${YELLOW}Step 4: Installing additional tools...${NC}"
apt install -y git curl certbot

echo -e "${YELLOW}Step 5: Cloning repository...${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Directory exists, pulling latest..."
    cd $APP_DIR
    git pull origin main || git pull origin master
else
    git clone https://github.com/$GITHUB_REPO.git $APP_DIR
    cd $APP_DIR
fi

echo -e "${YELLOW}Step 6: Creating environment file...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 32)
    SECRETS_MASTER_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || openssl rand -base64 32)
    SEED_SECRET=$(openssl rand -hex 16)
    
    cat > $APP_DIR/.env << EOF
# UltraCloud SMS Environment Configuration
# Generated on $(date)

# Security Keys (DO NOT SHARE!)
JWT_SECRET=$JWT_SECRET
SECRETS_MASTER_KEY=$SECRETS_MASTER_KEY
SEED_SECRET=$SEED_SECRET

# Domain
DOMAIN=$DOMAIN

# CORS Origins (comma-separated)
CORS_ORIGINS=https://getucloudy.com,https://www.getucloudy.com

# MongoDB (internal docker network)
MONGO_URL=mongodb://mongodb:27017
DB_NAME=sms_relay_db
EOF
    
    echo -e "${GREEN}Environment file created. Please review: $APP_DIR/.env${NC}"
else
    echo "Environment file already exists"
fi

echo -e "${YELLOW}Step 7: Setting up SSL with Let's Encrypt...${NC}"
mkdir -p $APP_DIR/nginx/ssl

# Initial certificate (will be done manually or via certbot)
echo -e "${YELLOW}For SSL, run after DNS is pointed to this server:${NC}"
echo "certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"

echo -e "${YELLOW}Step 8: Building and starting containers...${NC}"
cd $APP_DIR
docker compose build
docker compose up -d

echo -e "${YELLOW}Step 9: Waiting for services to start...${NC}"
sleep 15

echo -e "${YELLOW}Step 10: Running database seed...${NC}"
# Get the seed secret from .env
SEED_SECRET=$(grep SEED_SECRET $APP_DIR/.env | cut -d '=' -f2)
curl -X POST http://localhost:8001/api/seed-database \
    -H "Content-Type: application/json" \
    -H "X-Seed-Secret: $SEED_SECRET" || echo "Seed may have already run"

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Server IP: $(curl -s ifconfig.me)"
echo "Domain: $DOMAIN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Point your domain DNS to this server's IP"
echo "2. Configure Cloudflare (if using):"
echo "   - SSL/TLS: Full (strict)"
echo "   - Proxy status: Proxied (orange cloud)"
echo "3. Whitelist server IP in Payscribe dashboard"
echo ""
echo "4. Set up GitHub Actions secrets:"
echo "   - VPS_HOST: $(curl -s ifconfig.me)"
echo "   - VPS_USERNAME: root (or your user)"
echo "   - VPS_SSH_KEY: (your private SSH key)"
echo ""
echo "5. Access admin panel:"
echo "   - URL: https://$DOMAIN"
echo "   - Email: admin@smsrelay.com"
echo "   - Password: admin123 (CHANGE THIS!)"
echo ""
echo -e "${GREEN}Enjoy UltraCloud SMS! 🚀${NC}"
