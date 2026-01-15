# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways (PaymentPoint, Plisio, Ercaspay), and admin panel.

## What's Been Implemented (Latest Session - Jan 15, 2026)

### UI/UX Redesign
1. **Landing Page** - Clean white background with dynamic green color scheme, logo image support
2. **Dashboard** - Green theme with balance card (border), My Cards section, banner carousel
3. **Sidebar** - Logo image display, dynamic menu colors

### Admin Controls Added
1. **Branding & Colors Section**
   - Brand Name (editable)
   - Logo URL (editable - use image link)
   - Primary Color (color picker)
   - Secondary Color (color picker)
   - Logo Preview
   
2. **Dashboard Banners Management**
   - Add/Edit/Delete banners
   - Image URL + optional link
   - Active toggle per banner
   
3. **Payment Gateway Controls**
   - Enable/disable Ercaspay
   - Enable/disable PaymentPoint
   - Enable/disable Plisio

### User Features Added
1. **Profile Settings Page**
   - Edit full name, phone
   - View wallet balances
   - Change password
   - View account tier

2. **Referral Program Page**
   - Display referral code
   - Copy referral link
   - Show referral stats (total referrals, earnings)
   - How it works section

### Bug Fixes
- Ercaspay amount field cursor issue (added autoComplete="off")
- Currency selector pushed to left on mobile
- Balance card border added

## Remaining Tasks (In Progress)

### P1 - High Priority
- Transaction detail modals for Deposits, Bank Accounts, All Transactions, Ercaspay Payments
- Popup Notifications edit/delete functionality

### P2 - Medium Priority  
- More Landing page style updates to match green color
- Additional mobile responsiveness improvements

## API Endpoints Added
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change password

## Database Schema Updates
- `pricing_config`:
  - `brand_logo_url` - URL for logo image
  - `secondary_color_hex` - Secondary theme color
  - `banner_images` - Array of banner objects {id, image_url, link, active}

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`

## Design System
- **Primary Color**: Emerald (#059669) - configurable from admin
- **Secondary Color**: (#10b981) - configurable from admin
- **Background**: White with gray-50 sections
- **Border Radius**: 2xl for cards, xl for buttons
