# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

### Bug Fixes Completed - Session 3
1. **SMS History Page Crash Fix**: Fixed `getServiceName` function to handle undefined/null service codes gracefully (returns "Unknown" instead of crashing)
2. **Reseller Portal Infinite Reload Fix**: Verified working - `initialFetch` state prevents re-fetching data loop
3. **Admin Branding Colors Fix**: Fixed `fetchPricing` in AdminPanel.js to read all 7 branding color fields from backend
4. **Reseller Cancel Order Revenue Fix**: Backend `reseller_cancel_order` endpoint now decrements `total_revenue_ngn` and `total_orders` when order is canceled

### Reseller System - COMPLETE
Complete reseller portal with API access for white-label SMS verification:
1. **User Reseller Portal**: 
   - Register as reseller with Free plan
   - View API key (show/hide, copy)
   - API documentation for all endpoints (cURL, Python, PHP, JavaScript examples)
   - Order history and stats
   - Plan upgrades

2. **Reseller API v1**:
   - `GET /api/reseller/v1/balance` - Get wallet balance
   - `GET /api/reseller/v1/servers` - List servers (usa, all_country_1, all_country_2)
   - `GET /api/reseller/v1/countries` - Get countries for a server
   - `GET /api/reseller/v1/services` - Get services with reseller pricing
   - `POST /api/reseller/v1/buy` - Purchase a number
   - `GET /api/reseller/v1/status` - Check order status/get OTP
   - `POST /api/reseller/v1/cancel` - Cancel and refund (now also decrements revenue)

3. **Subscription Plans**:
   - **Free**: ₦0/mo, same markup as regular users (0% discount)
   - **Basic**: ₦10,000/mo, 50% markup discount
   - **Pro**: ₦50,000/mo, 70% markup discount
   - **Enterprise**: ₦100,000/mo, 80% markup discount

4. **Admin Reseller Management**:
   - Edit plan prices and markup multipliers
   - View all resellers with stats
   - Set custom markup per reseller
   - Suspend/activate reseller accounts

### Admin Panel Structure - COMPLETE
Split into 6 dedicated sections:
1. **Page Toggles** - Control which dashboard pages are visible to users
2. **Payment Gateways** - Enable/disable Ercaspay, PaymentPoint, Plisio
3. **Promo Codes** - Create and manage discount codes
4. **Branding & Banners** - Logo, 7 theme colors, landing page content, dashboard banners
5. **SMS Providers** - Provider balances, markup rates, API keys
6. **Resellers** - Reseller management section

### Branding Color Settings - COMPLETE
All 7 color fields now save and persist:
1. **Primary Color** - Main brand color
2. **Secondary Color** - Secondary brand color
3. **Button/CTA Color** - Sign Up, Order Now buttons
4. **Accent Color** - Service cards, features section styling
5. **Header Background** - Navigation bar color
6. **Hero Gradient Start** - Hero section gradient start
7. **Hero Gradient End** - Hero section gradient end

## Current State Summary
- ✅ Landing page with dynamic admin colors
- ✅ Dashboard with green theme
- ✅ Admin panel split into 6 configuration pages
- ✅ Complete Reseller system with API and admin management
- ✅ API Documentation page for resellers
- ✅ SMS History page working (fixed crash bug)
- ✅ Admin branding colors save correctly
- ✅ Reseller revenue calculation correct (cancels decrement revenue)
- ✅ Mobile-responsive sidebar
- ✅ Transaction detail modals
- ✅ Popup notifications management

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`

## 3rd Party Integrations
- DaisySMS (OTP Service)
- SMS-pool (OTP Service)
- 5sim (OTP Service)
- PaymentPoint (NGN Virtual Accounts)
- Payscribe (Bill Payments)
- Plisio (Cryptocurrency Payments)
- Ercaspay (NGN Card/Bank Payments)

## Key Files
- `/app/backend/server.py` - Backend API (5000+ lines)
- `/app/frontend/src/pages/NewDashboard.js` - User Dashboard (3400+ lines)
- `/app/frontend/src/pages/AdminPanel.js` - Admin Panel
- `/app/frontend/src/pages/Landing.js` - Landing page

## Upcoming Tasks (P1)
- Complete Profile Settings functionality
- Complete Referral page functionality
- Finalize Admin User Management (Edit user)
- Verify Popup Notifications edit/delete

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure
- Refactor NewDashboard.js into smaller components
- Refactor AdminPanel.js into smaller components
- Delete deprecated files (Dashboard.js, NewAdminPanel.js)

## Known Lower Priority Issues (P3)
- Ercaspay amount field loses focus during typing
- Admin "Bank Accounts" page showing no data
- "Total OTP Volume" metric in admin may be incorrect
