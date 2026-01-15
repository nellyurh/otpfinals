# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

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

## Current State Summary
- ✅ Landing page with dynamic green color
- ✅ Dashboard with green theme
- ✅ Mobile-responsive sidebar with hamburger menu
- ✅ Admin panel mobile-responsive
- ✅ Transaction detail modals working
- ✅ Popup notifications management (create, edit, delete)
- ✅ Virtual SMS as default page on login

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
