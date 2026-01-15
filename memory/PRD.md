# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

### Reseller System - NEW
Complete reseller portal with API access for white-label SMS verification:
1. **User Reseller Portal**: 
   - Register as reseller with Free plan
   - View API key (show/hide, copy)
   - API documentation for all endpoints
   - Order history and stats
   - Plan upgrades

2. **Reseller API v1**:
   - `GET /api/reseller/v1/balance` - Get wallet balance
   - `GET /api/reseller/v1/servers` - List servers (usa, all_country_1, all_country_2)
   - `GET /api/reseller/v1/countries` - Get countries for a server
   - `GET /api/reseller/v1/services` - Get services with reseller pricing
   - `POST /api/reseller/v1/buy` - Purchase a number
   - `GET /api/reseller/v1/status` - Check order status/get OTP
   - `POST /api/reseller/v1/cancel` - Cancel and refund

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

5. **Provider Names Hidden**:
   - Servers are labeled as "usa", "all_country_1", "all_country_2"
   - Internal provider names (smspool, daisysms, 5sim) never exposed to resellers

### Admin Panel Split - NEW
The "Wallet & Pricing" page has been split into 5 separate, more expansive pages:
1. **Page Toggles** - Control which dashboard pages are visible to users
2. **Payment Gateways** - Enable/disable Ercaspay, PaymentPoint, Plisio with visual cards + crypto rates
3. **Promo Codes** - Create and manage discount codes with full form
4. **Branding & Banners** - Logo, theme colors, landing page content, dashboard banners
5. **SMS Providers** - Provider balances, markup rates, 5sim coin rate, API keys
6. **Resellers** - NEW section for reseller management

### Landing Page Update
- Changed "Become an Agent" button to "Get Started"

### Admin Color Settings Expansion
1. **Button/CTA Color** - Controls Sign Up, Order Now buttons on landing page
2. **Accent Color** - Controls service cards, features section styling
3. **Header Background** - Customizable navigation bar color
4. **Hero Gradient Start/End** - Hero section background gradient colors
5. **Live Preview** - Color preview shows how buttons will look

### Virtual SMS Mobile Responsiveness Fix
1. **Card Layout for Mobile** - Verification table replaced with stacked cards on mobile
2. **Text Size Reduction** - All labels, prices, and buttons use smaller fonts
3. **Compact Purchase Form** - Reduced padding and spacing throughout

## Current State Summary
- ✅ Landing page with dynamic admin colors and "Get Started" button
- ✅ Dashboard with green theme
- ✅ Admin panel split into 6 separate configuration pages
- ✅ Complete Reseller system with API and admin management
- ✅ Provider names hidden from users and resellers
- ✅ Mobile-responsive sidebar with hamburger menu
- ✅ Admin panel mobile-responsive
- ✅ Transaction detail modals working
- ✅ Popup notifications management (create, edit, delete)
- ✅ Virtual SMS as default page on login

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
