# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-01-25 (Session 2)**: Payscribe API Fixes + Page Toggles + Payout Webhook
  - Improved Payscribe API error handling with user-friendly messages
  - Added helpful error message when API key is invalid: "Payscribe API key is invalid. Please contact admin to update API keys."
  - Updated LOGOS for all bill payment services (TV, Electricity, Betting, Airtime, Data)
  - Added page toggles for: Bills Payment, Electricity, TV, Betting, Send Money, Bank Transfer
  - Implemented Payscribe payout webhook endpoint at POST /api/webhooks/payscribe/payout
  - Webhook handles payouts.created, payouts.success, payouts.failed events
  - Automatic refund to user wallet on failed payouts
  - Added Payscribe toggle to Payment Gateways section in Admin Panel
- **2026-01-25 (Session 1)**: KYC System Complete + Bank Transfer Feature + Admin Enhancements
  - Fixed KYC fee to ₦100 total (was incorrectly showing ₦200)
  - Split full_name into first_name and last_name fields
  - Added name field locking after KYC verification (Tier 2+)
  - Added address field to profile and Tier 3 KYC form
  - Implemented camera-only selfie capture with liveness verification
  - Admin Panel: First Name, Last Name, Tier columns in user table
  - Admin Panel: Tier dropdown (1/2/3) for user management
  - NEW: Bank Transfer (withdrawal) feature in Bills Payment
- **2026-01-24**: P0/P1 Feature Implementation - Sidebar Redesign, Bills Payment, W2W Transfers

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel. Extended to bill payments, KYC verification, and financial services.

## Latest Updates (January 25, 2026)

### Session 2 - Payscribe API Fixes + Page Toggles + Webhook

**Payscribe API Error Handling:**
- Improved error messages when Payscribe API key is invalid/expired
- Frontend shows helpful message: "Payscribe API key is invalid. Please contact admin to update API keys."
- Admin can update Payscribe keys in Admin → Payment Gateways

**Page Toggles (Admin Panel):**
All bill payment services now have individual page toggles:
- Bills Payment (hub page)
- Electricity
- TV Subscription (DSTV, GOtv, StarTimes)
- Betting (wallet funding)
- Send Money (wallet-to-wallet)
- Bank Transfer (withdraw to bank)

**Payscribe Payout Webhook:**
- Endpoint: POST /api/webhooks/payscribe/payout
- Handles events: payouts.created, payouts.success, payouts.failed
- Auto-refunds user wallet on failed payouts
- Sends notifications to users on status changes
- Webhook source IP: 162.254.34.78

**Service Logos:**
Updated logos for:
- Networks: MTN, Airtel, Glo, 9mobile
- Electricity: EKEDC, IKEDC, AEDC, PHED, KEDCO, BEDC, JED, KAEDCO, EEDC, IBEDC
- TV: DSTV, GOtv, StarTimes, Showmax
- Betting: Bet9ja, SportyBet, 1xBet, Betway, BetKing, NairaBet

## Core Features

### Bills Payment Hub
Six services:
1. **Buy Data** - MTN, Airtel, Glo, 9mobile
2. **Electricity** - All Nigerian DisCos
3. **TV Subscription** - DSTV, GOtv, StarTimes
4. **Betting** - Bet9ja, SportyBet, 1xBet, etc.
5. **Send Money** - Wallet-to-wallet transfer
6. **Bank Transfer** - Withdraw to 28+ Nigerian banks

### KYC Verification
**Tier 1** (Default): ₦10,000 limit
**Tier 2**: ₦100,000 limit (BVN stored)
**Tier 3** (Express KYC): ₦2,000,000 limit
- ₦100 verification fee
- BVN + NIN lookup via Payscribe
- Selfie with liveness check
- Address verification

### Payment Gateways
- Ercaspay (cards, bank transfer)
- PaymentPoint (virtual accounts)
- Plisio (crypto)
- Payscribe (bill payments, bank transfers)

## API Endpoints

### Webhooks
- POST /api/webhooks/payscribe/payout - Handle Payscribe payout status updates
- POST /api/webhooks/ercaspay - Handle Ercaspay payment notifications

### Page Toggles
- GET /api/user/page-toggles - Get enabled/disabled pages for dashboard

### Bill Payments
- GET /api/payscribe/data-plans - Get data plans for network
- POST /api/payscribe/buy-data - Purchase data bundle
- POST /api/payscribe/buy-airtime - Purchase airtime
- GET /api/payscribe/tv-plans - Get TV subscription plans
- POST /api/payscribe/pay-tv - Pay TV subscription
- POST /api/payscribe/buy-electricity - Pay electricity bill

### Bank Transfer
- GET /api/banks/list - Get Nigerian banks list
- GET /api/banks/validate-account - Validate bank account
- POST /api/banks/transfer - Initiate bank withdrawal

## Known Issues

### P0 (Critical)
None currently

### P1 (High Priority)
- **Payscribe API Key**: The hardcoded API key is invalid/expired. User must update keys in Admin → Payment Gateways to enable bill payments.

### P2 (Medium Priority)
- Refactor monolithic server.py into modular FastAPI routers
- Break down large NewDashboard.js into smaller components
- Mobile UI issues (Reseller Portal horizontal scroll)

## Technology Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Authentication**: JWT
- **Payments**: Ercaspay, Payscribe, PaymentPoint, Plisio

## Files of Reference
- /app/backend/server.py - Main backend
- /app/frontend/src/pages/NewDashboard.js - Dashboard
- /app/frontend/src/pages/AdminPanel.js - Admin functionality
- /app/frontend/src/components/BillPaymentSections.js - Bills Payment

## Webhook Configuration

### Payscribe Payout Webhook
```
URL: https://[your-domain]/api/webhooks/payscribe/payout
Method: POST
Source IP: 162.254.34.78
```

Sample Payload:
```json
{
  "event_id": "uuid",
  "event_type": "payouts.success",
  "trans_id": "uuid",
  "ref": "BT-XXXXXXXX",
  "amount": 10000,
  "fee": 50,
  "total": 10050,
  "beneficiary": {
    "bank": "044",
    "bank_name": "Access Bank",
    "account_number": "0123456789",
    "account_name": "Account Name"
  },
  "status": "success",
  "created_at": "2025-01-25 12:00:00"
}
```
