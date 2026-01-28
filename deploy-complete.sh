#!/bin/bash

# =============================================
# SocialSMS World - Complete VPS Deployment
# Domain: socialsmsworld.com
# Server IP: 178.18.247.113
# =============================================
#
# USAGE: Upload this entire folder to your VPS and run:
#   chmod +x deploy-complete.sh && sudo ./deploy-complete.sh
#
# This script will:
# 1. Install Docker & dependencies
# 2. Set up firewall
# 3. Generate security keys
# 4. Use socialsmsworld.com configs
# 5. Build and start all containers
# =============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="socialsmsworld.com"
APP_DIR=$(pwd)

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     SocialSMS World - VPS Deployment      ║"
echo "║     Domain: socialsmsworld.com            ║"
echo "║     Server: 178.18.247.113                ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo ./deploy-complete.sh)${NC}"
    exit 1
fi

# Step 1: System Update
echo -e "\n${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Docker
echo -e "\n${YELLOW}[2/8] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "\n${YELLOW}[3/8] Installing Docker Compose...${NC}"
apt install -y docker-compose-plugin curl
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Step 4: Setup Firewall
echo -e "\n${YELLOW}[4/8] Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured (SSH, HTTP, HTTPS allowed)${NC}"

# Step 5: Generate environment variables
echo -e "\n${YELLOW}[5/8] Generating security keys...${NC}"
if [ ! -f ".env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    SECRETS_MASTER_KEY=$(openssl rand -base64 32)
    SEED_SECRET=$(openssl rand -hex 16)
    
    cat > .env << EOF
# SocialSMS World - Environment Configuration
# Domain: socialsmsworld.com
# Generated: $(date)

JWT_SECRET=$JWT_SECRET
SECRETS_MASTER_KEY=$SECRETS_MASTER_KEY
SEED_SECRET=$SEED_SECRET
EOF
    echo -e "${GREEN}✓ Security keys generated${NC}"
else
    echo -e "${GREEN}✓ Using existing .env file${NC}"
fi

# Step 6: Use socialsmsworld.com configurations
echo -e "\n${YELLOW}[6/8] Setting up socialsmsworld.com configuration...${NC}"

# Backup original files
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.getucloudy.yml.bak
fi
if [ -f "nginx/nginx.conf" ]; then
    cp nginx/nginx.conf nginx/nginx.getucloudy.conf.bak
fi

# Use socialsmsworld configs
if [ -f "docker-compose.socialsmsworld.yml" ]; then
    cp docker-compose.socialsmsworld.yml docker-compose.yml
    echo -e "${GREEN}✓ docker-compose.yml configured for socialsmsworld.com${NC}"
fi

if [ -f "nginx/nginx.socialsmsworld.conf" ]; then
    cp nginx/nginx.socialsmsworld.conf nginx/nginx.conf
    echo -e "${GREEN}✓ nginx.conf configured for socialsmsworld.com${NC}"
fi

# Step 7: Setup SSL directory
echo -e "\n${YELLOW}[7/8] Setting up SSL...${NC}"
mkdir -p nginx/ssl

if [ ! -f "nginx/ssl/cloudflare.crt" ]; then
    echo -e "${YELLOW}⚠ SSL certificates not found!${NC}"
    echo ""
    echo "Please add your Cloudflare Origin Certificate:"
    echo "  1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server"
    echo "  2. Create certificate for: socialsmsworld.com, *.socialsmsworld.com"
    echo "  3. Save certificate to: nginx/ssl/cloudflare.crt"
    echo "  4. Save private key to: nginx/ssl/cloudflare.key"
    echo ""
    echo -e "${YELLOW}Creating placeholder files...${NC}"
    
    # Create placeholder (you must replace these!)
    cat > nginx/ssl/cloudflare.crt << 'EOF'
-----BEGIN CERTIFICATE-----
PASTE YOUR CLOUDFLARE ORIGIN CERTIFICATE HERE
-----END CERTIFICATE-----
EOF
    
    cat > nginx/ssl/cloudflare.key << 'EOF'
-----BEGIN PRIVATE KEY-----
PASTE YOUR CLOUDFLARE PRIVATE KEY HERE
-----END PRIVATE KEY-----
EOF
    
    chmod 600 nginx/ssl/cloudflare.key
    echo -e "${RED}⚠ Remember to replace SSL placeholders before starting!${NC}"
else
    echo -e "${GREEN}✓ SSL certificates found${NC}"
fi

# Step 8: Build and Deploy
echo -e "\n${YELLOW}[8/8] Building and starting containers...${NC}"
docker compose build --no-cache
docker compose up -d

# Wait for services
echo -e "\n${YELLOW}Waiting for services to start (30 seconds)...${NC}"
sleep 30

# Health check
echo -e "\n${YELLOW}Running health check...${NC}"
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

if curl -s http://localhost:3000 | grep -q "html"; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend check failed${NC}"
fi

# Done!
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║           DEPLOYMENT COMPLETE! 🚀                     ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  Domain:    https://socialsmsworld.com                ║"
echo "║  Server IP: 178.18.247.113                            ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  NEXT STEPS:                                          ║"
echo "║  1. Add SSL certs to nginx/ssl/ (if not done)         ║"
echo "║  2. Point DNS: socialsmsworld.com → 178.18.247.113    ║"
echo "║  3. In Cloudflare: SSL mode = Full (strict)           ║"
echo "║  4. Register admin account & promote via MongoDB      ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo "  docker compose logs -f          # View all logs"
echo "  docker compose logs -f backend  # View backend logs"
echo "  docker compose restart          # Restart all services"
echo "  docker compose down             # Stop all services"
echo ""
