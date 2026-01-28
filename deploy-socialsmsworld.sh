#!/bin/bash

# SocialSMS World - Contabo VPS Setup Script
# Domain: socialsmsworld.com
# Server IP: 178.18.247.113
# 
# Run this script on a fresh Ubuntu 22.04 VPS:
# chmod +x deploy-socialsmsworld.sh && sudo ./deploy-socialsmsworld.sh

set -e

echo "=========================================="
echo "SocialSMS World - VPS Setup Script"
echo "Domain: socialsmsworld.com"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./deploy-socialsmsworld.sh)${NC}"
    exit 1
fi

# Configuration
DOMAIN="socialsmsworld.com"
APP_DIR="/opt/socialsmsworld"

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
apt install -y docker-compose-plugin

echo -e "${YELLOW}Step 4: Installing additional tools...${NC}"
apt install -y git curl ufw

echo -e "${YELLOW}Step 5: Setting up firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo -e "${YELLOW}Step 6: Creating app directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Step 7: Creating environment file...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 32)
    SECRETS_MASTER_KEY=$(openssl rand -base64 32)
    SEED_SECRET=$(openssl rand -hex 16)
    
    cat > $APP_DIR/.env << EOF
# SocialSMS World Environment Configuration
# Generated on $(date)

# Security Keys (DO NOT SHARE!)
JWT_SECRET=$JWT_SECRET
SECRETS_MASTER_KEY=$SECRETS_MASTER_KEY
SEED_SECRET=$SEED_SECRET

# Domain
DOMAIN=$DOMAIN
EOF
    
    echo -e "${GREEN}Environment file created at $APP_DIR/.env${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Pre-Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Upload your app files to: $APP_DIR"
echo "   - Use SFTP/SCP to copy backend/, frontend/, docker-compose.yml, nginx/"
echo ""
echo "2. After uploading, run:"
echo "   cd $APP_DIR && docker compose build && docker compose up -d"
echo ""
echo "3. Point DNS to this server: 178.18.247.113"
echo ""
