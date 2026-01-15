# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

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

### Mobile Responsiveness Fixes
1. **Virtual SMS as Default Page** - Users now land on the SMS page instead of Dashboard
2. **My Cards Hidden on Mobile** - Removed card section on mobile for cleaner view
3. **Reduced Font Sizes** - All text sizes reduced for better mobile fit
4. **Sidebar Styling** - Compact sidebar with smaller icons, reduced padding

### Admin Panel Responsiveness
1. **Hamburger Menu Added** - Mobile-responsive admin panel with slide-out sidebar
2. **Transaction Detail Modals** - View button on each row opens full details
3. **Compact Tables** - Reduced column widths and font sizes

### Features Implemented
1. **Branding Controls** (Admin)
   - Brand Name, Logo URL, Primary Color, Secondary Color
   - Button/CTA Color, Accent Color, Header Background
   - Hero Gradient Colors (Start/End)
   - Live logo preview

2. **Dashboard Banners** (Admin)
   - Add/Edit/Delete banners with image URL + optional link
   - Active toggle per banner

3. **Payment Gateway Controls** (Admin)
   - Toggle switches for Ercaspay, PaymentPoint, Plisio

4. **Profile Settings Page** (User)
   - Edit full name, phone
   - Change password
   - View wallet balances

5. **Referral Program Page** (User)
   - Copy referral code/link
   - View stats

6. **Transaction Details** (Admin)
   - View modal for Deposits, Bank Accounts, Transactions, Ercaspay Payments

### Bug Fixes
- Ercaspay amount field cursor issue fixed
- Mobile horizontal scrolling fixed
- Balance card border added
- Virtual SMS verification card responsiveness fixed

## Current State Summary
- ✅ Landing page with dynamic admin colors
- ✅ Dashboard with green theme
- ✅ Mobile-responsive sidebar with hamburger menu
- ✅ Admin panel mobile-responsive
- ✅ Transaction detail modals working
- ✅ Popup notifications management (create, edit, delete)
- ✅ Virtual SMS as default page on login

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
