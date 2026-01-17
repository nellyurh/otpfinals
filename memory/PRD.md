# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 17, 2026)

### Session 8 - Bug Fixes & Deployment Prep

**Critical Bug Fixes:**

1. **Ercaspay/Promo Code Input Reset Bug - PERMANENTLY FIXED** ✅
   - Root cause: `setInterval` polling on lines 178-179 of `NewDashboard.js` was causing parent re-renders every 10 seconds (orders) and 30 seconds (notifications)
   - Solution: Removed the `setInterval` calls and added a manual refresh button to the header
   - Users can now click the refresh icon to manually update their data
   - Verified: Input value "5000" persisted after 12+ seconds wait

2. **Emergent Watermark Removed** ✅
   - Removed the "Made with Emergent" badge from `/app/frontend/public/index.html`
   - Updated page title to "UltraCloud SMS | OTP Verification Service"
   - Cleaned up hardcoded Emergent URLs from reseller API base URL defaults

3. **Dashboard Balance Card - Already Had Solid Gradient** ✅
   - Verified the balance card has a solid green gradient background using the branding primary color
   - No changes needed - styling was already correct

**UI Improvements:**
- Added a refresh button to the dashboard header (circular arrow icon)
- Refresh button updates: profile, orders, notifications, and transactions on click

### Session 7 - Bug Fixes & UI Improvements

**Bug Fixes:**

1. **Promo Code Not Reducing Total (ADDING instead) - FIXED** ✅
   - Root cause: For US Server (DaisySMS), the frontend calculated price CLIENT-SIDE without calling backend API, thus ignoring promo codes
   - Solution: Now when `promoCode` exists for `us_server`, frontend calls `/api/orders/calculate-price` endpoint

2. **Ercaspay Input Clearing After ~10 Seconds - PARTIALLY FIXED** ✅
   - Extracted `FundWalletSection` to `/app/frontend/src/components/FundWalletSection.js`
   - Full fix applied in Session 8 by removing setInterval polling

3. **Promo Code Creation Error - FIXED** ✅
   - Root cause: MongoDB `insert_one()` adds `_id` (ObjectId) which isn't JSON serializable
   - Solution: Added `doc.pop('_id', None)` after insert

**UI Improvements:**

4. **Quick Service Cards - ENHANCED** ✅
   - Added colorful gradient backgrounds for each service:
     - Virtual Numbers: Green gradient (emerald)
     - Internet Data: Blue gradient (sky)
     - TV Sub: Purple gradient (violet)
     - Airtime: Orange gradient (amber)
     - Electricity: Yellow gradient
     - Virtual Cards: Pink gradient (rose)

5. **History Tables - ENHANCED** ✅
   - Added View buttons to Transactions table with proper styling
   - Added View buttons to SMS History table with service icons

6. **Form Field Styling - UPDATED** ✅
   - Airtime page: Updated to rounded-xl inputs with emerald focus colors
   - Buy Data page: Updated to rounded-xl inputs with emerald focus colors

## Completed Features

### User Dashboard
- ✅ Virtual Numbers purchasing with multiple providers
- ✅ Fund Wallet (PaymentPoint, Ercaspay, Crypto via Plisio)
- ✅ SMS History with status tracking
- ✅ Transactions list
- ✅ Profile Settings (update name, phone, password)
- ✅ Referral Program (code, link, stats)
- ✅ Account Upgrade/KYC
- ✅ Reseller Portal with API documentation
- ✅ Manual data refresh button

### Admin Panel (15 sections)
1. Dashboard - KPIs, money flow, user behavior metrics
2. Page Toggles - Enable/disable features
3. Payment Gateways - Configure payment providers
4. Promo Codes - Create and manage promo codes
5. Branding & Banners - Site branding, colors, images
6. SMS Providers - Provider API keys and markups
7. Users - View, edit, suspend, block users
8. Deposits - View user deposits
9. Bank Accounts - View PaymentPoint virtual accounts
10. All Transactions - View all user transactions
11. Ercaspay Payments - View Ercaspay payment records
12. Popup Notifications - Create, edit, delete notifications
13. Resellers - Manage reseller plans and accounts
14. OTP Sales - Sales statistics and order history
15. Reseller Sales - Reseller sales statistics

## Provider to Server Mapping
| Provider | Server Name |
|----------|-------------|
| daisysms | US Server |
| smspool | Server 1 |
| 5sim | Server 2 |

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
- Test Reseller API Key: `rsk_9cdb16694e964427991ff3209e029a38`

## Key Files
- `/app/backend/server.py` - Main backend (5900+ lines)
- `/app/frontend/src/pages/AdminPanel.js` - Admin dashboard (3900+ lines)
- `/app/frontend/src/pages/NewDashboard.js` - User dashboard (3700+ lines)
- `/app/frontend/src/pages/Landing.js` - Landing page
- `/app/frontend/src/components/FundWalletSection.js` - Fund wallet component
- `/app/frontend/src/components/VirtualNumbersSection.js` - Virtual numbers component
- `/app/backend/Dockerfile` - Backend Docker config
- `/app/frontend/Dockerfile` - Frontend Docker config

## Deployment Configuration

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
```

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build
RUN npm install -g serve
CMD serve -s build -l $PORT
```

### Required Environment Variables

**Backend (.env)**
- `MONGO_URL` - MongoDB connection string (use MongoDB Atlas for external deployment)
- `JWT_SECRET` - Secret key for JWT tokens
- `SMSPOOL_API_KEY` - SMS-pool API key
- `FIVESIM_API_KEY` - 5sim API key  
- `DAISYSMS_API_KEY` - DaisySMS API key
- `PAYMENTPOINT_API_KEY` - PaymentPoint API key
- `ERCASPAY_SECRET_KEY` - Ercaspay secret key
- `PLISIO_SECRET_KEY` - Plisio secret key

**Frontend (.env)**
- `REACT_APP_BACKEND_URL` - Full URL to backend API (e.g., https://your-backend.railway.app)

## Deployment Steps (Railway/Digital Ocean)

1. **MongoDB Atlas Setup**
   - Create a free cluster at mongodb.com/cloud/atlas
   - Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

2. **Backend Deployment**
   - Set Root Directory to `backend`
   - Add all environment variables
   - Deploy using Dockerfile

3. **Frontend Deployment**
   - Set Root Directory to `frontend`
   - Set `REACT_APP_BACKEND_URL` build arg to backend URL
   - Deploy using Dockerfile

4. **Database Seeding**
   - Visit `{backend_url}/api/seed-database` once to create admin user

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure (routes/admin.py, routes/reseller.py, etc.)
- Refactor NewDashboard.js into smaller components
- Refactor AdminPanel.js into smaller components
- Delete deprecated files: `/app/frontend/src/pages/NewAdminPanel.js`, `/app/frontend/src/pages/Dashboard.js`

## 3rd Party Integrations
- **DaisySMS** (OTP Service)
- **SMS-pool** (OTP Service)  
- **5sim** (OTP Service)
- **PaymentPoint** (NGN Virtual Accounts)
- **Payscribe** (Bill Payments)
- **Plisio** (Cryptocurrency Payments)
- **Ercaspay** (NGN Card/Bank Payments)

## Test Reports
- `/app/test_reports/iteration_5.json` - Latest test results (13/13 passed)
- `/app/tests/test_iteration5_features.py` - Backend tests
