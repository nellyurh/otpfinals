# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-01-25**: KYC System Complete + Bank Transfer Feature + Admin Enhancements
  - Fixed KYC fee to ₦100 total (was incorrectly showing ₦200)
  - Split full_name into first_name and last_name fields
  - Added name field locking after KYC verification (Tier 2+)
  - Added address field to profile and Tier 3 KYC form
  - Implemented camera-only selfie capture with liveness verification
  - Added selfie upload endpoint (/api/user/upload-selfie)
  - Admin Panel: First Name, Last Name, Tier columns in user table
  - Admin Panel: Tier dropdown (1/2/3) for user management
  - Admin Panel: View KYC data (masked BVN/NIN, selfie link)
  - NEW: Bank Transfer (withdrawal) feature in Bills Payment
  - Backend: /api/banks/list, /api/banks/validate-account, /api/banks/transfer
- **2026-01-24**: P0/P1 Feature Implementation - Sidebar Redesign, Bills Payment, W2W Transfers
  - Removed "Betting" from sidebar
  - Added "Send Money" (Wallet-to-Wallet transfers) with NEW badge
  - Added "Bills Payment" page with Electricity and TV Subscription tabs
  - Redesigned Buy Data with card-based network selection and category tabs (Daily, Weekly, Monthly, Mega)
  - Redesigned Airtime with custom amount input
  - New backend endpoints: /api/wallet/transfer, /api/wallet/validate-recipient, /api/payscribe/validate-meter, /api/payscribe/buy-electricity, /api/payscribe/tv-plans, /api/payscribe/validate-smartcard, /api/payscribe/pay-tv
- **2026-01-22**: Payscribe Integration Complete + Security Hardening + Deployment Configs

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel. Extended to bill payments, KYC verification, and financial services.

## Latest Updates (January 25, 2026)

### Session 17 - KYC Fixes + Bank Transfer + Admin Enhancements

**KYC System Fixes (P1 COMPLETE):**
1. **Profile Fields**: Separated first_name and last_name (from full_name)
2. **Field Locking**: Names locked after KYC verification (Tier 2+)
3. **Address Field**: Added to profile and Tier 3 KYC form
4. **KYC Fee Fixed**: Now correctly shows ₦100 total (was ₦200)
5. **Selfie Capture**: Camera-only with liveness verification (blink → turn → smile)

**Admin Panel Enhancements:**
1. **User Table**: Shows First Name, Last Name, Tier columns (not full_name)
2. **Tier Control**: Dropdown to set user tier (1, 2, or 3)
3. **KYC Data View**: Shows masked BVN/NIN, address, selfie/ID links

**Bank Transfer Feature (P2 COMPLETE):**
1. **Location**: Bills Payment → Bank Transfer
2. **Features**:
   - Select from 28+ Nigerian banks (including OPay, PalmPay, Kuda, Moniepoint)
   - Account number validation
   - ₦50 service fee per transfer
   - Minimum withdrawal: ₦1,000
   - Tier-based limits (₦10K/₦100K/₦2M)
   - Narration/description field
3. **Endpoints**:
   - GET /api/banks/list - List Nigerian banks
   - GET /api/banks/validate-account - Validate bank account
   - POST /api/banks/transfer - Initiate withdrawal

## Core Features

### Authentication & Users
- JWT-based authentication
- Registration with first_name, last_name, email, password
- Three-tier KYC verification system
- Profile management with address

### Wallet System
- NGN and USD balances
- Multiple funding options (Ercaspay, Payscribe, PaymentPoint)
- Wallet-to-wallet transfers
- Bank withdrawals (NEW)

### Bills Payment Hub
Six services:
1. **Buy Data** - MTN, Airtel, Glo, 9mobile
2. **Electricity** - EKEDC, IKEDC, AEDC, PHED, etc.
3. **TV Subscription** - DSTV, GOtv, StarTimes
4. **Betting** - Bet9ja, SportyBet, 1xBet, Betway, BetKing
5. **Send Money** - Wallet-to-wallet transfer
6. **Bank Transfer** - Withdraw to bank account (NEW)

### Virtual Services
- Virtual Numbers (OTP reception)
- Virtual Cards (Tier 3 only)
- Gift Cards marketplace

### KYC Verification
**Tier 1** (Default):
- Limit: ₦10,000
- No verification required

**Tier 2**:
- Limit: ₦100,000
- Submit BVN (stored, not verified)

**Tier 3** (Express KYC):
- Limit: ₦2,000,000
- ₦100 verification fee
- BVN + NIN lookup via Payscribe
- Selfie capture with liveness check
- Address verification

### Admin Panel
- User management (create, edit, suspend, block)
- Tier control (upgrade/downgrade)
- KYC data viewing
- Transaction history
- Promo codes
- API key management
- Branding customization

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/reset-password

### User Profile
- GET /api/user/profile
- PUT /api/user/profile
- POST /api/user/upload-selfie

### KYC
- POST /api/kyc/tier2/submit
- POST /api/kyc/verify-bvn
- POST /api/kyc/verify-nin
- GET /api/kyc/status

### Banks
- GET /api/banks/list
- GET /api/banks/validate-account
- POST /api/banks/transfer

### Admin
- GET /api/admin/users
- PUT /api/admin/users/{user_id}
- GET /api/admin/dashboard

## Known Issues

### P0 (Critical)
None currently

### P1 (High Priority)
- **Payscribe API**: Bill payments (Data, TV, Electricity) return empty results due to API key configuration. User needs to verify Payscribe API credentials are valid.

### P2 (Medium Priority)
- Mobile UI: Reseller Portal horizontal scroll (recurring)
- Code quality: server.py needs modularization into routers

## Technology Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Authentication**: JWT
- **Payments**: Ercaspay, Payscribe, PaymentPoint, Plisio
- **OTP Services**: DaisySMS, SMS-pool, 5sim, TigerSMS
- **Gift Cards**: Reloadly
- **Email**: Titan Mail (SMTP)

## Files of Reference
- /app/backend/server.py - Main backend
- /app/frontend/src/pages/NewDashboard.js - Dashboard with ProfileSection
- /app/frontend/src/pages/AdminPanel.js - Admin functionality
- /app/frontend/src/components/BillPaymentSections.js - Bills Payment hub
- /app/frontend/src/pages/Landing.js - Registration/Login
