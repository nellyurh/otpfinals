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

## What's Been Implemented

### Session: January 15, 2026 (Latest Update)

#### Completed Tasks:

1. **Mobile Responsive Sidebar**
   - Added hamburger menu icon for mobile
   - Sidebar slides in from left on mobile
   - Overlay background when sidebar is open
   - X button to close sidebar
   - Sidebar auto-closes when menu item is selected

2. **Default Dashboard Section**
   - Changed default section from 'virtual-numbers' to 'dashboard'
   - Dashboard loads by default when user logs in

3. **Dark Mode Toggle**
   - Added dark mode toggle button in header
   - Saves preference to localStorage
   - Toggles document.documentElement 'dark' class

4. **Notification System UI**
   - Added notification bell icon with unread count badge
   - Dropdown shows list of notifications
   - Mark as read and dismiss functionality
   - Login popup modal for announcements
   - Fetches notifications from backend API

5. **Admin User Management (PUT endpoint)**
   - `GET /api/admin/users/{user_id}` - Get single user
   - `PUT /api/admin/users/{user_id}` - Update user details
   - Can edit: full_name, email, phone, ngn_balance, usd_balance, is_suspended, is_blocked, is_admin
   - Audit logging for admin actions

6. **Popup Notifications Admin Panel**
   - New "Popup Notifications" section in admin sidebar
   - Create/Edit/Delete notifications
   - Notification types: promo, support, deposit_bonus, downtime, custom
   - Fields: title, message, popup_type, action_url, action_text, image_url, active, show_on_login, priority
   - Login popups show on user dashboard after login

7. **Promo Code Validation Enhancement**
   - Added "Apply" button next to promo code input
   - Shows success message with discount amount when valid
   - Green border/background when promo is applied
   - Improved error handling with backend error messages

8. **Previous Session Tasks:**
   - Fixed Plisio "Expired Deposit" display issue
   - Ercaspay Payment Gateway Integration (orange theme, logos)
   - Added payment provider logos (Ercaspay, PaymentPoint, Plisio)
   - Improved Plisio UI design

## Prioritized Backlog

### P0 - Critical
- None currently

### P1 - High Priority
- Referral Program page functionality
- Profile Settings page (password change)

### P2 - Medium Priority
- Dark mode CSS theming (currently only toggles class, needs CSS vars)

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
- `notification_receipts` - User notification read/dismiss status
- `admin_audit_logs` - Admin action audit trail

## API Endpoints Summary

### User Endpoints
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/login-popups` - Get login popup notifications
- `POST /api/notifications/{id}/read` - Mark notification as read
- `POST /api/notifications/{id}/dismiss` - Dismiss notification

### Admin Endpoints
- `GET /api/admin/users/{user_id}` - Get single user details
- `PUT /api/admin/users/{user_id}` - Update user details
- `POST /api/admin/notifications` - Create notification
- `PUT /api/admin/notifications/{id}` - Update notification
- `DELETE /api/admin/notifications/{id}` - Delete notification
- `GET /api/admin/notifications` - List all notifications

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
