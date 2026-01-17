# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 17, 2026)

### Session 9 - UI Improvements, Metrics & Deployment Config

**UI Changes:**

1. **Balance Card Updated** ✅
   - Removed "History" button
   - Removed "Manage Wallet" link
   - Currency switcher (NGN/USD) moved to top right of balance card
   - Clean, minimal design with only "Add Money" button

2. **Landing Page Enhanced** ✅
   - Added Testimonials section with 3 customer reviews
   - Added FAQ section with 5 common questions
   - Added CTA section "Ready to Get Started?"
   - Total sections: Hero, Services, Popular Services, How It Works, Features, Stats, Testimonials, FAQ, CTA, Footer

3. **Promo Code** ✅
   - Backend verified working correctly (SAVE40 reduces ₦2,475 to ₦1,485)
   - Frontend correctly displays discounted price
   - No code changes needed - issue was user understanding

**Admin Metrics:**

4. **Refund Tracking Added** ✅
   - New "Total Refunds" KPI card showing total refund amount
   - Shows cancelled order count as subtitle
   - New "Net Sales (Sales - Refunds)" KPI card
   - Backend calculates refunds from transaction history
   - Cancelled/refunded orders tracked separately

**Deployment Configuration:**

5. **Digital Ocean App Platform** ✅
   - Created `.do/app.yaml` configuration file
   - Auto-configures backend and frontend services
   - Proper environment variable mapping

6. **README Updated** ✅
   - Added deployment instructions for Digital Ocean
   - Added deployment instructions for Railway
   - Added environment variable documentation

### Previous Sessions Summary

**Session 8:**
- Fixed Ercaspay/Promo code input reset (removed setInterval polling)
- Removed Emergent watermark
- Added manual refresh button

**Session 7:**
- Fixed promo code calculation for US Server
- Extracted FundWalletSection component
- Added colorful service card gradients

## Completed Features

### User Dashboard
- ✅ Virtual Numbers purchasing with multiple providers
- ✅ Fund Wallet (PaymentPoint, Ercaspay, Crypto via Plisio)
- ✅ SMS History with status tracking
- ✅ Transactions list
- ✅ Profile Settings
- ✅ Referral Program
- ✅ Account Upgrade/KYC
- ✅ Reseller Portal with API documentation
- ✅ Manual data refresh button

### Admin Panel (15 sections)
1. Dashboard - KPIs including refund metrics
2. Page Toggles
3. Payment Gateways
4. Promo Codes
5. Branding & Banners
6. SMS Providers
7. Users
8. Deposits
9. Bank Accounts
10. All Transactions
11. Ercaspay Payments
12. Popup Notifications
13. Resellers
14. OTP Sales
15. Reseller Sales

### Landing Page Sections
1. Hero with floating badges
2. Our Services grid
3. Popular Services cards
4. How It Works (3 steps)
5. Why Choose Us (features)
6. Stats banner
7. Testimonials (3 reviews)
8. FAQ (5 questions)
9. CTA section
10. Footer

## Deployment

### Digital Ocean
- Use `.do/app.yaml` for automatic configuration
- Set environment variables in Digital Ocean dashboard

### Railway
- Create separate backend/frontend services
- Set root directories appropriately
- Use provided Dockerfiles

### Environment Variables

**Backend:**
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SMSPOOL_API_KEY`, `FIVESIM_API_KEY`, `DAISYSMS_API_KEY`
- `PAYMENTPOINT_API_KEY`, `ERCASPAY_SECRET_KEY`, `PLISIO_SECRET_KEY`

**Frontend:**
- `REACT_APP_BACKEND_URL` - Backend API URL

## Test Credentials
- Admin: `admin@smsrelay.com` / `admin123`

## Key Files
- `/app/backend/server.py` - Main backend
- `/app/frontend/src/pages/AdminPanel.js` - Admin dashboard
- `/app/frontend/src/pages/NewDashboard.js` - User dashboard
- `/app/frontend/src/pages/Landing.js` - Landing page
- `/app/.do/app.yaml` - Digital Ocean config
- `/app/backend/Dockerfile` - Backend Docker
- `/app/frontend/Dockerfile` - Frontend Docker

## Future Tasks (P2-P3)
- Refactor server.py into modular structure
- Refactor large React components
- Delete deprecated files

## 3rd Party Integrations
- DaisySMS, SMS-pool, 5sim (OTP Services)
- PaymentPoint, Ercaspay, Plisio (Payments)
- Payscribe (Bill Payments)
