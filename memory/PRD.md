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
- User management
- Pricing configuration
- Provider API key management
- Transaction monitoring
- Ercaspay payments management

## What's Been Implemented

### Session: January 15, 2026 (Latest)

#### Completed Tasks:
1. **Fixed Plisio "Expired Deposit" Display Issue**
   - Updated `/api/crypto/plisio/current` endpoint to check expiry time
   - Automatically marks expired deposits as 'expired' status
   - Returns null for expired deposits

2. **Ercaspay Payment Gateway Integration**
   - Backend endpoints for initiate, webhook, verify, admin list
   - Frontend with orange theme and Ercaspay logo
   - Two payment buttons: "Pay with Card" and "Bank Transfer"
   - Admin panel "Ercaspay Payments" section

3. **UI Improvements - Payment Logos**
   - Added Ercaspay logo (https://merchant.ercaspay.com/logo.png)
   - Added PaymentPoint logo (https://www.paymentpoint.co/assets/pdark-rbg-cf3cced4.png)
   - Added Plisio logo (https://plisio.net/v2/images/logo-color.svg)
   - Changed Ercaspay color from purple to orange

4. **Fixed Ercaspay Amount Field Reload Issue**
   - Moved state to parent component level to prevent re-render

5. **Improved Plisio UI Design**
   - Modern card-based layout inspired by reference screenshot
   - Cleaner QR code and address display
   - Better timer visibility
   - Status badges with animations

6. **Enhanced Promo Code Validation UI**
   - Added "Apply" button that appears when promo code is entered
   - Green success message when promo is valid
   - Visual feedback with checkmark icon
   - Input field turns green when promo is applied

### Previous Sessions:
- Core OTP functionality (DaisySMS, SMS-pool, 5sim)
- Plisio crypto deposit integration
- PaymentPoint virtual account generation
- Admin panel with dashboard, settings, users, providers sections
- Payscribe bill payments (Data, Airtime, Betting)
- Notification system backend

## Prioritized Backlog

### P0 - Critical
- None currently

### P1 - High Priority
- Finalize Admin User Management (edit/suspend users via PUT endpoint)
- Implement User Notification UI (bell icon dropdown, login pop-up)

### P2 - Medium Priority
- Re-implement dark mode toggle
- Implement Referral Program page functionality
- Implement Profile Settings page (password change)

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
- `/app/backend/server.py` - Main backend (monolithic, ~4800 lines)
- `/app/frontend/src/pages/NewDashboard.js` - User dashboard
- `/app/frontend/src/pages/AdminPanel.js` - Admin interface
- `/app/frontend/src/components/VirtualNumbersSection.js` - OTP purchase UI

## Database Collections
- `users` - User accounts with balances
- `sms_orders` - OTP purchase orders
- `transactions` - All financial transactions
- `crypto_invoices` - Plisio crypto deposits
- `ercaspay_payments` - Ercaspay card/bank payments
- `pricing_config` - Global configuration
- `promo_codes` - Discount codes
- `notifications` - System notifications

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection
- `JWT_SECRET` - Token signing key
- `PAYMENTPOINT_*` - Virtual account API
- `PAYSCRIBE_API_KEY` - Bill payments
- `PLISIO_SECRET_KEY` - Crypto payments
- `ERCASPAY_SECRET_KEY` - Card/bank payments
- `ERCASPAY_API_KEY` - Ercaspay API key
- Provider keys: DAISYSMS, SMSPOOL, TIGERSMS, FIVESIM

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - API base URL

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
