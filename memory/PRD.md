# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-01-24**: P0/P1 Feature Implementation - Sidebar Redesign, Bills Payment, W2W Transfers
  - Removed "Betting" from sidebar
  - Added "Send Money" (Wallet-to-Wallet transfers) with NEW badge
  - Added "Bills Payment" page with Electricity and TV Subscription tabs
  - Redesigned Buy Data with card-based network selection and category tabs (Daily, Weekly, Monthly, Mega)
  - Redesigned Airtime with custom amount input
  - New backend endpoints: /api/wallet/transfer, /api/wallet/validate-recipient, /api/payscribe/validate-meter, /api/payscribe/buy-electricity, /api/payscribe/tv-plans, /api/payscribe/validate-smartcard, /api/payscribe/pay-tv
- **2026-01-22**: Payscribe Integration Complete + Security Hardening + Deployment Configs
  - Fixed Payscribe Collections API integration (dynamic virtual accounts)
  - Added admin controls for Payscribe keys (public + secret)
  - Added payment page UI with animated confirmation state
  - Added "RECOMMENDED" badge for Payscribe in Fund Wallet
  - Fixed bank name display with abbreviations (9PSB)
  - Secured /api/seed-database endpoint (requires X-Seed-Secret header)
  - Fixed CORS (no more allow_origins: * with credentials)
  - Added API key encryption at rest (Fernet/AES)
  - Added audit logging for sensitive key changes
  - Created Docker deployment configs for Contabo VPS
  - Created GitHub Actions CI/CD workflow
  - Created comprehensive DEPLOYMENT_GUIDE.md
- **2025-01-21**: Landing page enhancements - Added Gift Cards section with brand logos (Amazon, iTunes, Google Play, Steam, Netflix, Spotify, PlayStation, Xbox). Updated SEO meta tags with Open Graph support for WhatsApp/social sharing. Generated social preview image. Removed Emergent references from meta description.
- **2025-01-20**: 5sim pricing fixed - API returns USD directly, removed coin conversion. Admin panel cleanup - removed TigerSMS markup, added 5sim markup.
- **2025-01-19**: Fixed SMS pricing, OTP display, mobile responsiveness, Ercaspay payment gateway.

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 24, 2026)

### Session 15 - P0/P1 Feature Implementation

**Sidebar Redesign:**
1. Removed "Betting" from sidebar menu
2. Added "Send Money" with NEW badge (Wallet-to-Wallet transfers)
3. Added "Bills Payment" with NEW badge
4. Updated menu labels: "Buy Data" (was "Buy Data Bundle"), "Airtime" (was "Airtime Top-Up")

**Bills Payment Page (NEW):**
1. Two tabs: Electricity and TV Subscription
2. Electricity tab features:
   - Provider cards (EKEDC, IKEDC, AEDC, PHED, KEDCO, BEDC, JED, KAEDCO)
   - Meter type toggle (Prepaid/Postpaid)
   - Meter number input with Verify button
   - Amount input with preset buttons (₦1,000 to ₦50,000)
3. TV Subscription tab features:
   - Provider cards (DSTV, GOtv, StarTimes)
   - Smartcard/IUC input with Verify button
   - Plan category tabs (All, Basic, Standard, Premium)
   - Plan selection cards

**Wallet-to-Wallet Transfer (NEW):**
1. Available Balance display card
2. Recipient email input with search/verify button
3. Amount input with preset buttons (₦500, ₦1,000, ₦2,000, ₦5,000)
4. Optional note field
5. Recent transfers history display

**Buy Data Redesign:**
1. Card-based network selection (MTN yellow, Airtel red, Glo green, 9mobile dark green)
2. Plan category tabs (Daily, Weekly, Monthly, Mega)
3. Plan cards showing name and price
4. Phone number input

**Airtime Redesign:**
1. Card-based network selection
2. Custom amount input (min ₦50)
3. Preset amount buttons (₦100 to ₦5,000)

**New API Endpoints:**
- `GET /api/wallet/validate-recipient?email=...` - Validate recipient for W2W transfer
- `POST /api/wallet/transfer` - Transfer funds to another user
- `GET /api/wallet/recent-transfers` - Get recent transfer history
- `GET /api/payscribe/validate-meter?provider=&meter_number=&meter_type=` - Validate electricity meter
- `POST /api/payscribe/buy-electricity` - Purchase electricity
- `GET /api/payscribe/tv-plans?provider=` - Get TV subscription plans
- `GET /api/payscribe/validate-smartcard?provider=&smartcard=` - Validate TV smartcard
- `POST /api/payscribe/pay-tv` - Pay TV subscription

**Files Modified:**
- `/app/frontend/src/pages/NewDashboard.js` - Updated sidebar menu, section rendering
- `/app/frontend/src/components/BillPaymentSections.js` - Complete rewrite with 4 new components
- `/app/backend/server.py` - Added 8 new API endpoints

**Testing Status:**
- Backend: 100% (14/14 tests passed)
- Frontend: 95% (All UI components working)
- Note: Payscribe third-party API returning auth errors - API key configuration issue in admin panel

## Previous Updates (January 21, 2026)

### Session 14 - Landing Page & SEO Improvements

**Landing Page Enhancements:**
1. Added Gift Cards section with brand logos
   - Amazon, iTunes, Google Play, Steam, Netflix, Spotify, PlayStation, Xbox
   - Feature cards: Instant Delivery, 100% Genuine, Global Brands
2. Added "Gift Cards" floating badge in hero section
3. Added "Gift Cards" to services grid

**SEO Improvements:**
1. Updated meta description (removed Emergent reference)
2. Added Open Graph tags for social sharing (WhatsApp, Facebook)
3. Added Twitter Card meta tags
4. Generated social preview image for link sharing
5. Added keywords, author, robots meta tags

## Previous Updates

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
- CI/CD pipeline fix - Frontend Dockerfile uses node:20, verify GitHub Actions workflow
- PaymentPoint virtual account generation not working
- User migration from Digital Ocean to Contabo (waiting on user)
- Reseller Portal horizontal scroll on mobile
- Reseller buy/sell for 5sim broken after pricing changes
- Mobile sidebar navigation flaky
- Virtual Cards backend implementation
- Gift card webhooks for real-time status
- Gift card filtering by category/brand
- Refactor server.py into modular structure (APIRouter)
- Refactor large React components

## 3rd Party Integrations
- DaisySMS, SMS-pool, 5sim (OTP Services)
- PaymentPoint, Ercaspay, Plisio (Payments)
- Payscribe (Bill Payments)
