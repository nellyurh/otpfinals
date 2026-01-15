# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP (One-Time Password) service platform, "UltraCloud Sms," that acts as an intermediary between users and SMS service providers (DaisySMS, SMS-pool, 5sim). The platform includes JWT-based auth, a user wallet system, crypto deposits via Plisio, card/bank payments via Ercaspay, and a comprehensive admin panel.

## User Personas
1. **End Users** - People who need virtual phone numbers for OTP verification
2. **Administrators** - Platform operators who manage users, pricing, and monitor transactions

## Core Requirements

### Authentication
- JWT-based authentication
- User registration with email, password, full name, phone
- Admin role support

### Wallet System
- Dual currency support (NGN and USD)
- Multiple funding methods:
  - Bank Transfer (PaymentPoint virtual accounts)
  - Crypto (Plisio - USDT, BTC, ETH, etc.)
  - Card/Bank Transfer (Ercaspay)

### OTP Services
- Integration with DaisySMS, SMS-pool, 5sim
- Service discovery and pricing
- Order management with 10-minute timeout
- Auto-refund on timeout/cancellation
- Promo code support with validation

### Admin Panel
- Dashboard with key metrics
- User management (view, edit, suspend, block)
- Pricing configuration
- Provider API key management
- Transaction monitoring
- Ercaspay payments management
- Popup Notifications management
- **Payment Gateway Controls** (enable/disable gateways)

## What's Been Implemented

### Session: January 15, 2026 (Latest Update)

#### Major UI/UX Redesign (NEW)
Based on user-provided inspiration screenshots, completely redesigned:

1. **Landing Page Redesign**
   - Clean white background (no black/dark theme)
   - Purple (#6366f1) and emerald (#10b981) accent colors
   - Modern hero section with floating service badges (Data, TV-Sub, Airtime, Electricity)
   - Service cards grid (Virtual Numbers, Internet Data, TV Sub, Airtime, Electricity, Virtual Cards)
   - "Our Services" section with arrow buttons like Screenshot 3
   - Popular Services section with pricing cards
   - How It Works section with 3 steps
   - Features section with icons
   - Stats section with gradient background
   - Clean white authentication modal

2. **Dashboard Redesign**
   - Clean white sidebar with purple accents
   - Modern "Total Balance" card with currency toggle (NGN/USD)
   - Gradient "My Cards" section with virtual debit card design
   - Image banner carousel with auto-rotate (5 seconds)
   - Quick Services grid (6 cards with colored titles and arrow buttons)
   - Recent Transactions section
   - Mobile-responsive design with hamburger menu

3. **Fund Wallet Page**
   - Three payment gateway cards:
     - Ercaspay (Card/Bank) - Orange theme
     - PaymentPoint (NGN Virtual Account) - Green/Emerald theme
     - Plisio (Crypto) - Blue theme
   - All gateways conditionally rendered based on admin toggle

4. **Admin Payment Gateway Controls (NEW)**
   - Added to Settings section in Admin Panel
   - Toggle switches for each payment gateway:
     - Ercaspay (Card/Bank) - Orange indicator
     - PaymentPoint (NGN) - Green indicator
     - Plisio (Crypto) - Blue indicator
   - Provider logos displayed next to toggles
   - Warning message about impact of disabling gateways
   - Changes take effect immediately on user's Fund Wallet page

5. **Mobile Responsiveness Fixes**
   - Fixed horizontal scrolling issue on mobile dashboard
   - Buttons stack properly on mobile viewport (390px)
   - Balance card, My Cards, and banner carousel scale correctly

#### Previous Session Tasks:
- Mobile Responsive Sidebar with hamburger menu
- Default Dashboard Section on login
- Dark Mode Toggle
- Notification System UI (bell icon, dropdown, login popups)
- Admin User Management (PUT endpoint)
- Popup Notifications Admin Panel
- Promo Code Validation Enhancement
- Mobile UI Improvements (reduced text sizes, compact grid)
- Fixed Plisio "Expired Deposit" display issue
- Ercaspay Payment Gateway Integration
- Added payment provider logos

## Prioritized Backlog

### P0 - Critical
- None currently

### P1 - High Priority
- Referral Program page functionality
- Profile Settings page (password change)
- Admin-editable Image Banners (convert hardcoded banner to admin-managed)

### P2 - Medium Priority
- Dark mode CSS theming (currently only toggles class, needs CSS vars)
- Fix "Total OTP Volume" metric in admin dashboard
- Fix "Bank Accounts" page showing no data

### P3 - Low Priority / Tech Debt
- Refactor `server.py` into modular routes (admin.py, payments.py, etc.)
- Refactor large frontend components (AdminPanel.js, NewDashboard.js)
- Delete deprecated files (NewAdminPanel.js, Dashboard.js)

## Technical Architecture

### Backend
- Framework: FastAPI (Python)
- Database: MongoDB (Motor async driver)
- Authentication: JWT tokens
- External APIs: DaisySMS, SMS-pool, 5sim, PaymentPoint, Payscribe, Plisio, Ercaspay

### Frontend
- Framework: React
- Styling: TailwindCSS
- Components: Shadcn UI
- HTTP Client: Axios

### Key Files
- `/app/backend/server.py` - Main backend (monolithic, ~5000 lines)
- `/app/frontend/src/pages/Landing.js` - Redesigned landing page
- `/app/frontend/src/pages/NewDashboard.js` - User dashboard (redesigned)
- `/app/frontend/src/pages/AdminPanel.js` - Admin interface (with Payment Gateway Controls)
- `/app/frontend/src/components/VirtualNumbersSection.js` - OTP purchase UI

## Database Collections
- `users` - User accounts with balances
- `sms_orders` - OTP purchase orders
- `transactions` - All financial transactions
- `crypto_invoices` - Plisio crypto deposits
- `ercaspay_payments` - Ercaspay card/bank payments
- `pricing_config` - Global configuration (includes payment gateway toggles)
- `promo_codes` - Discount codes
- `notifications` - System notifications
- `notification_receipts` - User notification read/dismiss status
- `admin_audit_logs` - Admin action audit trail

## PricingConfig Schema (Updated)
```json
{
  "enable_paymentpoint": true,
  "enable_plisio": true,
  "enable_ercaspay": true,
  // ... other fields
}
```

## API Endpoints Summary

### User Endpoints
- `GET /api/user/page-toggles` - Get page and payment gateway toggles
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/login-popups` - Get login popup notifications

### Admin Endpoints
- `PUT /api/admin/pricing` - Update pricing config (includes payment gateway toggles)
- `GET /api/admin/users/{user_id}` - Get single user details
- `PUT /api/admin/users/{user_id}` - Update user details
- `POST /api/admin/notifications` - Create notification
- `PUT /api/admin/notifications/{id}` - Update notification
- `DELETE /api/admin/notifications/{id}` - Delete notification

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`

## Design System (Updated)
- **Primary Color**: Purple (#6366f1)
- **Secondary Color**: Emerald (#10b981)
- **Accent Colors**: Orange, Blue, Pink
- **Background**: White (#ffffff) with Gray-50 (#f9fafb) sections
- **Border Radius**: 2xl (16px) for cards, xl (12px) for buttons
- **Shadow**: shadow-lg shadow-purple-200 for primary elements
