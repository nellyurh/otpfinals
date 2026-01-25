# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-01-25 (Session 4)**: Payscribe Payout API Fix + Admin Payouts Management
  - FIXED: Bank list now uses correct Payscribe endpoint (`payouts/bank/list`)
  - FIXED: Transfer fee now uses correct endpoint (`payouts/fee/?amount=X&currency=ngn`)
  - FIXED: Account validation now uses POST to `payouts/account/lookup`
  - FIXED: Bank transfer uses `payouts/transfer` with correct payload
  - FIXED: All payout APIs now use PUBLIC KEY (not secret key)
  - NEW: Admin "Bank Payouts" section for managing bank transfers
  - NEW: Admin can verify, complete, or refund payouts
  - NEW: `/api/payouts/verify/{ref}` - Verify payout status with Payscribe
- **2026-01-25 (Session 3)**: Transaction PIN System + Improved Bank Transfer Flow
  - Implemented complete Transaction PIN management system
  - PIN set, change, verify, reset with email code + BVN verification
  - Security & PIN tab added to Profile Settings
  - Bank list now fetched from Payscribe API (with fallback)
  - Auto account lookup when 10-digit account number entered
  - Transfer fee fetched from Payscribe API
  - PIN confirmation modal for all bank transfers
- **2026-01-25 (Session 2)**: Payscribe API Fixes + Page Toggles + Payout Webhook
  - Improved Payscribe API error handling
  - Page toggles for all bill payment services
  - Implemented Payscribe payout webhook endpoint
- **2026-01-25 (Session 1)**: KYC System Complete + Bank Transfer Feature + Admin Enhancements
  - Three-tier KYC system with BVN/NIN verification
  - Bank Transfer withdrawal feature
  - Admin Panel tier control and KYC viewing

## Latest Updates (January 25, 2026)

### Session 4 - Payscribe Payout API Integration Fix

**Problem Solved:**
The Payscribe payout API was returning 401 errors because:
1. Wrong API endpoints were being used
2. Secret key was used instead of PUBLIC key

**Correct Payscribe Payout Endpoints (all use PUBLIC key):**
| Feature | Endpoint | Method |
|---------|----------|--------|
| Bank List | `/api/v1/payouts/bank/list` | GET |
| Transfer Fee | `/api/v1/payouts/fee/?amount=X&currency=ngn` | GET |
| Account Lookup | `/api/v1/payouts/account/lookup` | POST |
| Transfer | `/api/v1/payouts/transfer` | POST |
| Verify | `/api/v1/payouts/verify/{ref}` | GET |

**Results:**
- Bank list now returns 560+ Nigerian banks (from Payscribe)
- Transfer fees fetched dynamically (e.g., ₦25 for ₦5,000)
- Account validation working correctly

**New Admin Features:**
- Admin Panel → Bank Payouts section
- View all bank transfer history
- Verify payout status with Payscribe
- Manually mark payouts as completed
- Refund stuck payouts to user wallet

### Session 3 - Transaction PIN System + Bank Transfer Improvements

**Transaction PIN Management:**
1. **Set PIN**: New users can set 4-digit transaction PIN
2. **Change PIN**: Users with PIN can change it with current PIN verification
3. **Reset PIN**: Forgot PIN? → Email code + BVN verification
4. **Profile Integration**: `has_transaction_pin` field in user profile
5. **Security Tab**: New "Security & PIN" tab in Profile Settings

**Improved Bank Transfer Flow:**
1. **Step 1**: Select Bank (fetched from Payscribe API, fallback to 22+ banks)
2. **Step 2**: Enter 10-digit account number (auto-lookup when complete)
3. **Step 3**: Amount field appears only after account verified
4. **Confirmation**: Modal shows fee (from Payscribe) + PIN entry
5. **All bill payments will require PIN confirmation**

**New API Endpoints:**
- `GET /api/user/pin/status` - Check if user has PIN set
- `POST /api/user/pin/set` - Create new PIN (4 digits)
- `PUT /api/user/pin/change` - Change existing PIN
- `POST /api/user/pin/verify` - Verify PIN is correct
- `POST /api/user/pin/reset-request` - Request reset code via email
- `POST /api/user/pin/reset-verify` - Verify code + BVN, set new PIN
- `GET /api/banks/transfer-fee?amount=X` - Get fee from Payscribe

## Core Features

### Transaction PIN Security
- Required for ALL bill payments and bank transfers
- 4-digit numeric PIN
- Set via Profile → Security & PIN tab
- Reset via email code + BVN verification
- Cannot proceed with transfers until PIN is set

### Bills Payment Hub
Six services (all require PIN confirmation):
1. **Buy Data** - MTN, Airtel, Glo, 9mobile
2. **Electricity** - All Nigerian DisCos
3. **TV Subscription** - DSTV, GOtv, StarTimes
4. **Betting** - Bet9ja, SportyBet, 1xBet, etc.
5. **Send Money** - Wallet-to-wallet transfer
6. **Bank Transfer** - Withdraw to 22+ Nigerian banks

### Bank Transfer Flow
1. Select bank from Payscribe-fetched list
2. Enter account number (10 digits triggers auto-lookup)
3. Account name displayed after verification
4. Enter amount (shows quick preset buttons)
5. Add narration (optional)
6. Click "Continue to Confirm"
7. Modal shows: recipient, bank, amount, fee, total
8. Enter 4-digit PIN to authorize
9. Transfer initiated

### KYC Verification
**Tier 1** (Default): ₦10,000 limit
**Tier 2**: ₦100,000 limit (BVN stored)
**Tier 3** (Express KYC): ₦2,000,000 limit
- ₦100 verification fee
- BVN + NIN lookup via Payscribe
- Selfie with liveness check
- Address verification

## API Endpoints

### PIN Management
- `GET /api/user/pin/status` - Returns {has_pin: boolean}
- `POST /api/user/pin/set` - {pin, confirm_pin}
- `PUT /api/user/pin/change` - {current_pin, new_pin, confirm_pin}
- `POST /api/user/pin/verify` - {pin}
- `POST /api/user/pin/reset-request` - Sends 6-digit code to email
- `POST /api/user/pin/reset-verify` - {reset_code, bvn, new_pin, confirm_pin}

### Banks
- `GET /api/banks/list` - Nigerian banks (Payscribe or fallback)
- `GET /api/banks/transfer-fee?amount=X` - Fee from Payscribe
- `GET /api/banks/validate-account?bank_code=X&account_number=X` - Account lookup
- `POST /api/banks/transfer` - {bank_code, account_number, account_name, amount, pin, narration}

### Webhooks
- `POST /api/webhooks/payscribe/payout` - Handle payout status updates

## Known Issues

### P0 (Critical)
None currently

### P1 (High Priority)
- **Payscribe API**: May return 500 errors intermittently. Fallback mechanisms in place.

### P2 (Medium Priority)
- Refactor monolithic server.py into modular routers
- Break down large NewDashboard.js into smaller components

## Technology Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Authentication**: JWT + Transaction PIN
- **Payments**: Ercaspay, Payscribe, PaymentPoint, Plisio

## Files of Reference
- /app/backend/server.py - PIN management, bank transfer endpoints
- /app/frontend/src/pages/NewDashboard.js - Security & PIN tab
- /app/frontend/src/components/BillPaymentSections.js - Bank Transfer with PIN modal

## Database Schema Updates

### users collection
```javascript
{
  // Existing fields...
  transaction_pin_hash: String,  // bcrypt hash of 4-digit PIN
  pin_reset_code: String,        // 6-digit reset code
  pin_reset_expiry: String,      // ISO datetime
  has_transaction_pin: Boolean   // Computed field in API response
}
```
