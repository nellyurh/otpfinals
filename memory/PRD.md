# UltraCloud SMS - Product Requirements Document

## Changelog
- **2025-01-19**: Fixed SMS pricing inconsistency - purchase endpoint now uses same pricing logic as calculate-price. DaisySMS was using live API pricing in purchase but static pricing in calculate, causing overcharges.
- **2025-01-19**: Fixed OTP/SMS not showing in active orders - orders now stay visible when code is received. Added polling to auto-refresh orders every 5 seconds. Made SMS History mobile responsive with card layout. Fixed Ercaspay payment gateway.
- **2025-01-19**: Fixed Ercaspay payment gateway - now allows all payment methods (card, bank-transfer, ussd, qrcode) at checkout. Fixed USD to NGN conversion transactions not showing in history (wrong API endpoint).
- **2025-01-18**: Fixed Gift Cards not loading issue. The `giftcardsConfig` wasn't being included in save requests. Added environment variable indicator in Admin Panel.

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 19, 2026)

### Session 13 - Pricing Fix & OTP Display Improvements

**Completed Tasks:**

1. **Fixed SMS Pricing Inconsistency** ✅
   - Purchase endpoint was using live DaisySMS API pricing
   - Calculate-price endpoint was using static DAISYSMS_PRICES
   - This caused users to see one price but be charged differently
   - Now both endpoints use consistent static pricing
   - Also fixed: Area code markup now 20% (was 35% in purchase)
   - Also fixed: 5sim markup key was inconsistent

2. **Fixed OTP Not Showing in Active Orders** ✅
   - Orders now remain visible when SMS/OTP code is received
   - Status changes from "Waiting..." to "✓ Code Received" with green highlight
   - Orders with OTP stay visible for 10 minutes after creation
   - Order card turns green when code is received

3. **Added Order Polling** ✅
   - Frontend now polls for order updates every 5 seconds
   - No more manual refresh needed to see received codes

4. **SMS History Mobile Responsive** ✅
   - Added mobile card layout (hidden on desktop)
   - Shows service, phone, code, status, and date in card format
   - No horizontal scroll on mobile

5. **Ercaspay Payment Gateway Fix** ✅
   - All payment methods now available at checkout
   - Users can choose: card, bank-transfer, ussd, or qrcode

6. **Currency Conversion History Fix** ✅
   - Fixed wrong API endpoint in ConvertCurrencySection
   - Conversion transactions now showing in history

## Previous Updates (January 18, 2026)

### Session 12 - Gift Cards (Reloadly Integration)

**Completed Tasks:**

1. **Reloadly Gift Cards Integration** ✅
   - Full integration with Reloadly Gift Cards API
   - Browse 2,900+ gift cards from 169 countries
   - **Searchable country dropdown** (user requested)
   - Filter by country, search by brand/product name
   - View detailed product info with redemption instructions
   - Purchase with recipient email and phone (gift delivery)
   - Order history tracking
   - NGN wallet balance payment with configurable markup

2. **Convert Currency Page** ✅ (Separate page, not modal)
   - New sidebar menu item "Convert Currency"
   - Dedicated page with USD/NGN balance cards
   - Exchange rate display
   - Conversion form with preview
   - Recent conversions history

3. **Admin Panel - Gift Cards Provider Section** ✅
   - New sidebar item "Gift Cards Provider"
   - Reloadly API credentials (Client ID, Client Secret)
   - Markup percentage setting
   - Sandbox/Live environment toggle
   - USD to NGN exchange rate configuration
   - Price preview with markup calculation

4. **UI Improvements** ✅
   - Removed balance card from Gift Cards page
   - Added searchable country dropdown (not plain select)

**New API Endpoints:**
- `GET /api/giftcards/countries` - List all countries with gift cards
- `GET /api/giftcards/products` - List gift card products (paginated, filterable)
- `GET /api/giftcards/products/{id}` - Get product details
- `POST /api/giftcards/order` - Place gift card order
- `GET /api/giftcards/orders` - User's order history
- `GET /api/giftcards/orders/{transaction_id}` - Order status
- `GET /api/giftcards/redeem-code/{transaction_id}` - Get redeem code
- `POST /api/wallet/convert-usd-to-ngn` - Convert USD to NGN
- `GET /api/wallet/exchange-rate` - Get current exchange rate

**Environment Variables Added:**
- `RELOADLY_CLIENT_ID` - Reloadly API client ID
- `RELOADLY_CLIENT_SECRET` - Reloadly API client secret

**Database Fields Added (pricing_config):**
- `reloadly_client_id` - API client ID (editable in admin)
- `reloadly_client_secret` - API client secret (editable in admin)
- `giftcard_markup_percent` - Markup percentage on gift card prices
- `giftcard_is_sandbox` - Boolean for sandbox/live mode
- `enable_giftcards` - Page toggle

---

### Session 11 - Support Channels & Mobile Responsiveness

**Completed Tasks:**

1. **Support Channel URLs (Admin Configurable)** ✅
   - Added `whatsapp_support_url`, `telegram_support_url`, `support_email` to PricingConfig
   - Admin Panel → Branding & Banners → Support Channel URLs section
   - Support section in user dashboard now uses dynamic URLs from admin config
   - Public branding endpoint returns support URLs

2. **Mobile Responsiveness Improvements** ✅
   - SMS History: Improved header responsiveness, min-width on table
   - API Documentation: Stacked layout on mobile, overflow-x-auto on tables
   - Reseller Orders Table: Added min-width for proper scrolling

**API Updates:**
- `GET /api/public/branding` - Now returns `whatsapp_support_url`, `telegram_support_url`, `support_email`
- `PUT /api/admin/pricing` - Now accepts support channel URL updates

### Previous Sessions Summary

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

**Session 10 - UI Polish & Landing Page Enhancement:**
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
