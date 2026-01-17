# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 17, 2026)

### Session 10 - UI Polish & Landing Page Enhancement

**UI Changes:**

1. **Balance Card Redesigned** ✅
   - Removed "History" button 
   - Removed "Manage Wallet" link
   - Currency switcher (NGN/USD) moved to top right corner
   - Clean design with only "Add Money" button
   - Uses admin-configured branding primary color for gradient background

2. **Logout Fixed** ✅
   - Fixed page flickering on logout
   - Now properly clears localStorage (token + user)
   - Uses `window.location.href = '/'` for clean redirect to homepage

3. **Auth Popup Logo** ✅
   - Now displays the brand logo (from admin branding settings)
   - Falls back to gradient phone icon if no logo configured

4. **Landing Page - New "Easy Telco Services" Section** ✅
   - Added comprehensive section showcasing all telco services:
     - Instant Airtime (⚡ Instant delivery)
     - Data Bundles (💰 Up to 40% cheaper)
     - TV Subscriptions (🎯 No delays)
     - Electricity Bills (✅ Instant tokens)
     - Virtual Numbers (🌍 100+ countries)
     - Virtual Cards (🛒 Shop globally)
   - Each card has icon, title, description, and highlight badge
   - "Get Started Now - It's Free" CTA button

**Promo Code Status:**
- Backend verified working correctly (SAVE40: ₦2,475 → ₦1,485)
- Frontend correctly displays discounted price
- Discount shows as "-₦900.00" with green checkmark confirmation

### Previous Session Summary

**Session 9:**
- Added Testimonials, FAQ, CTA sections to landing page
- Added refund metrics to admin dashboard (Total Refunds, Net Sales)
- Created Digital Ocean deployment config (`.do/app.yaml`)

**Session 8:**
- Fixed Ercaspay/Promo code input reset (removed setInterval polling)
- Removed Emergent watermark
- Added manual refresh button

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
- ✅ Clean balance card with currency toggle

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
6. **Easy Telco Services (NEW)** - 6 service cards with details
7. Stats banner
8. Testimonials (3 reviews)
9. FAQ (5 questions)
10. CTA section
11. Footer

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
- Admin User Management - Edit user details
- Verify Popup Notifications edit/delete
- Refactor server.py into modular structure
- Refactor large React components
- Delete deprecated files

## 3rd Party Integrations
- DaisySMS, SMS-pool, 5sim (OTP Services)
- PaymentPoint, Ercaspay, Plisio (Payments)
- Payscribe (Bill Payments)
