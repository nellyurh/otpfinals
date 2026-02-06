# BillHub/UltraCloud SMS - Deployment Guide

This guide provides clear, step-by-step instructions for deploying and managing both sites.

---

## Overview

| Site | Domain | Server | Directory | Docker-Compose File |
|------|--------|--------|-----------|---------------------|
| **GetUCloudy** | getucloudy.com | vmi3037781 | `/opt/otp` | `docker-compose.yml` |
| **SocialSMSWorld** | socialsmsworld.com | vmi3047924 (178.18.247.113) | `/opt/socialsmsworld` | `docker-compose.socialsmsworld.yml` |

---

## Site 1: GetUCloudy.com

### Server: vmi3037781
### Directory: `/opt/otp`
### Docker-Compose: `docker-compose.yml`

### Container Names (DO NOT use on other server):
- `ultracloud-mongodb`
- `ultracloud-backend`
- `ultracloud-frontend`
- `ultracloud-nginx`
- `ultracloud-certbot`

### Deployment Commands:

```bash
# SSH into the server
ssh root@vmi3037781

# Navigate to the project directory
cd /opt/otp

# Pull latest code
git pull origin main

# Build and restart containers
docker compose down
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps
docker logs ultracloud-backend --tail 100
```

### Environment Variables:
- Set in `/opt/otp/.env` file
- `CORS_ORIGINS=https://getucloudy.com,https://www.getucloudy.com`
- `REACT_APP_BACKEND_URL=https://getucloudy.com`

---

## Site 2: SocialSMSWorld.com

### Server: vmi3047924 (178.18.247.113)
### Directory: `/opt/socialsmsworld`
### Docker-Compose: `docker-compose.socialsmsworld.yml` (IMPORTANT!)

### Container Names (DO NOT use on other server):
- `socialsms-mongodb`
- `socialsms-backend`
- `socialsms-frontend`
- `socialsms-nginx`
- `socialsms-certbot`

### Deployment Commands:

```bash
# SSH into the server
ssh root@178.18.247.113

# Navigate to the project directory
cd /opt/socialsmsworld

# Pull latest code
git pull origin main

# IMPORTANT: Use the correct docker-compose file!
# BUILD AND RESTART (using the socialsmsworld config)
docker compose -f docker-compose.socialsmsworld.yml down
docker compose -f docker-compose.socialsmsworld.yml build --no-cache
docker compose -f docker-compose.socialsmsworld.yml up -d

# Check status
docker compose -f docker-compose.socialsmsworld.yml ps
docker logs socialsms-backend --tail 100
```

### Environment Variables:
- Set in `/opt/socialsmsworld/.env` file
- `CORS_ORIGINS=https://socialsmsworld.com,https://www.socialsmsworld.com`
- `REACT_APP_BACKEND_URL=https://socialsmsworld.com`

---

## Troubleshooting

### Problem: Login not working on SocialSMSWorld

**Cause:** Using wrong docker-compose file, creating `ultracloud-*` containers instead of `socialsms-*`.

**Solution:**
```bash
# 1. Stop all running containers
docker stop $(docker ps -aq)

# 2. Remove ALL containers (both ultracloud and socialsms)
docker rm ultracloud-mongodb ultracloud-backend ultracloud-frontend ultracloud-nginx ultracloud-certbot 2>/dev/null
docker rm socialsms-mongodb socialsms-backend socialsms-frontend socialsms-nginx socialsms-certbot 2>/dev/null

# 3. Deploy using the CORRECT file
cd /opt/socialsmsworld
docker compose -f docker-compose.socialsmsworld.yml up -d --build
```

### Problem: "Make Admin" or other admin actions not working

**Debugging Steps:**
1. Open browser Developer Tools (F12) → Network tab
2. Click the button and check the request/response
3. Check backend logs: `docker logs socialsms-backend --tail 100`
4. Verify you're logged in as an admin user
5. Check the API endpoint is correct: `/api/admin/users/{user_id}`

### Problem: Database is empty after deployment

**Cause:** New MongoDB container created without data.

**Solution:** Create a new admin user:
```bash
# Connect to the backend container
docker exec -it socialsms-backend bash

# Run Python to create admin
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient('mongodb://mongodb:27017')
    db = client['sms_relay_db']
    
    admin = {
        'id': str(uuid.uuid4()),
        'email': 'admin@socialsmsworld.com',
        'password_hash': bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode(),
        'full_name': 'Admin User',
        'first_name': 'Admin',
        'last_name': 'User',
        'phone': '08000000000',
        'is_admin': True,
        'ngn_balance': 100000.0,
        'usd_balance': 100.0,
        'tier': 1,
        'referral_code': 'ADMIN',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin)
    print(f"Admin created: admin@socialsmsworld.com / admin123")

asyncio.run(create_admin())
EOF
```

---

## Quick Reference Commands

### GetUCloudy (Server 1)
```bash
cd /opt/otp
docker compose up -d --build
docker compose ps
docker logs ultracloud-backend --tail 100
```

### SocialSMSWorld (Server 2)
```bash
cd /opt/socialsmsworld
docker compose -f docker-compose.socialsmsworld.yml up -d --build
docker compose -f docker-compose.socialsmsworld.yml ps
docker logs socialsms-backend --tail 100
```

---

## CRITICAL REMINDERS

1. **NEVER** use `docker compose up` on SocialSMSWorld server - ALWAYS use `-f docker-compose.socialsmsworld.yml`

2. **ALWAYS** verify container names after deployment:
   - GetUCloudy should show `ultracloud-*` containers
   - SocialSMSWorld should show `socialsms-*` containers

3. **Each site has its own MongoDB** - data is NOT shared between them

4. **Environment variables** are baked into the frontend during build time - rebuilding is required after changing `.env`

---

## Renaming docker-compose for simplicity (Optional)

To avoid using `-f` flag every time on SocialSMSWorld:

```bash
cd /opt/socialsmsworld

# Rename the default to avoid confusion
mv docker-compose.yml docker-compose.getucloudy.yml.backup

# Make socialsmsworld the default
cp docker-compose.socialsmsworld.yml docker-compose.yml

# Now you can just use:
docker compose up -d --build
```

**WARNING:** If you do this, make sure to update this file in git so you don't accidentally overwrite it with a `git pull`.
