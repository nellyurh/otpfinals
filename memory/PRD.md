# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-01-27 (Session 7)**: Admin Logo Upload + Card Min Funding Config + KYC Address Fields + Logo Size Control
  - NEW: Admin can upload brand logo from Admin Panel → Branding section
  - NEW: Uploaded logo is displayed on Virtual Cards instead of default "BillHub"
  - NEW: Admin can configure minimum card funding amount (previously hardcoded to $5)
  - NEW: Admin can configure logo sizes (header logo and card logo dimensions)
  - NEW: Deployment guide created for socialsmsworld.com (IP: 178.18.247.113)
  - FIXED: KYC Tier 3 form now has proper address fields matching Payscribe API:
    - Street address (required)
    - City (required)
    - State (dropdown with 36 Nigerian states + FCT)
    - Postal code (optional, defaults to 100001)
    - Country (defaults to NG)
  - FIXED: Payscribe customer creation uses correct address object format
- **2026-01-26 (Session 6)**: Payscribe Bill Payment API Fix + KYC Verification Fix + Selfie Simplification
  - FIXED: KYC Verification endpoints use correct Payscribe API format (`kyc/lookup?type=bvn&value=...`)
  - FIXED: Data purchase uses correct API format (`network`, `plan`, `recipient`)
  - FIXED: Electricity purchase uses correct API format with `customer_name` required
  - FIXED: TV subscription uses `multichoice/topup` for DSTV/GOTV
  - FIXED: Betting uses correct `/betting/vend` endpoint with `customer_name`
  - NEW: Transaction requery endpoint for pending transactions
  - SIMPLIFIED: Selfie capture - removed liveness detection, manual review instead
  - FIXED: Minimum electricity amount changed to ₦1,000 (per Payscribe API)
- **2026-01-25 (Session 5)**: Virtual Cards + Payscribe Customer + Tier 3 Restrictions
  - NEW: Automatic Payscribe customer creation on Tier 3 KYC verification
  - NEW: Bank Transfer restricted to Tier 3 users only
  - NEW: Complete Virtual Cards system with Payscribe integration
  - NEW: Card creation, funding, withdrawal features
  - NEW: Card fees (creation, funding, transaction, decline, monthly, withdrawal)
  - NEW: Admin Panel → Card Fees section for fee management
  - NEW: Card webhooks for transaction events
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
- **2026-01-25 (Session 2)**: Payscribe API Fixes + Page Toggles + Payout Webhook
- **2026-01-25 (Session 1)**: KYC System Complete + Bank Transfer Feature + Admin Enhancements

## Latest Updates (January 27, 2026)

### Session 7 - Admin Logo Upload + Card Min Funding + KYC Address Fields

**Admin Logo Upload:**
- Admin Panel → Branding & Banners section now includes logo file upload
- Supported formats: PNG, JPEG, WebP, SVG (max 5MB)
- Uploaded logos are stored at `/app/backend/uploads/branding/`
- Served via `/api/uploads/branding/{filename}`
- Logo URL is stored in `pricing_config.brand_logo_url`

**Virtual Card Branding:**
- Virtual Cards now display admin's uploaded logo instead of default "BillHub"
- Card designs use `branding.brand_logo_url` and `branding.brand_name`
- All card previews (promo page, wizard, card list) show the admin logo

**Card Fee Configuration:**
- Admin can now set minimum card funding amount via Admin Panel → Card Fees
- `card_min_funding_amount` is configurable (default: $1, can be set to $5 or any value)
- Frontend validates against admin-configured minimum

**KYC Tier 3 Address Fields (Payscribe Customer Creation):**
- Street Address (required) - Full street address
- City (required) - City name
- State (required) - Dropdown with all 36 Nigerian states + FCT
- Postal Code (optional) - Defaults to "100001"
- Country (preset to NG) - Nigeria ISO code

**API Endpoints Updated:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/upload-logo` | POST | Upload brand logo (multipart/form-data) |
| `/api/uploads/branding/{filename}` | GET | Serve uploaded logo |
| `/api/admin/card-fees` | PUT | Update card fees including min_funding_amount |
| `/api/cards` | GET | Returns fees object with min_funding from admin config |
| `/api/public/branding` | GET | Returns brand_logo_url for frontend |

## Previous Updates (January 26, 2026)

### Session 6 - Payscribe Bill Payment API Fixes

**Problem Solved:**
Multiple Payscribe bill payment APIs were using incorrect endpoint formats and missing required parameters.

**Correct Payscribe Bill Payment Endpoints (all use PUBLIC key):**
| Feature | Endpoint | Method | Required Fields |
|---------|----------|--------|-----------------|
| KYC Lookup | `/kyc/lookup?type=bvn&value=X` | GET | type, value |
| Data Plans | `/data/lookup?network=mtn` | GET | network |
| Data Vend | `/data/vend` | POST | recipient, network, plan, ref |
| Electricity Lookup | `/electricity/lookup?disco=X&meter=Y&type=Z` | GET | disco, meter, type |
| Electricity Vend | `/electricity/vend` | POST | meter_number, meter_type, amount, service, customer_name, ref |
| TV/Cable Lookup | `/cable/lookup?provider=X&smartcard=Y` | GET | provider, smartcard |
| TV Topup (DSTV/GOTV) | `/multichoice/topup` | POST | amount, customer_name, account, service, month, ref |
| Betting Lookup | `/betting/lookup?bet_id=X&customer_id=Y` | GET | bet_id, customer_id |
| Betting Fund | `/betting/vend` | POST | bet_id, customer_id, customer_name, amount, ref |
| Requery | `/requery/?trans_id=X` | GET | trans_id |

**KYC Verification Fixed:**
- BVN lookup: Uses `kyc/lookup?type=bvn&value=XXXXXXX`
- NIN lookup: Uses `kyc/lookup?type=nin&value=XXXXXXX`
- Response parsing handles nullable fields (last_name, dob)

**Selfie Capture Simplified:**
- Removed liveness detection (blink, turn, smile steps)
- Simple photo capture with face guide oval
- Selfies will be manually reviewed by admin

**New Endpoint:**
- `GET /api/payscribe/requery/{trans_id}` - Check status of pending transactions

## Previous Updates (January 25, 2026)

### Session 5 - Virtual Cards System

**Payscribe Customer Creation:**
- Automatic customer creation when user completes Tier 3 KYC verification
- Customer ID stored in user record (`payscribe_customer_id`)
- Required for virtual card services

**Tier 3 Restrictions:**
- Bank transfers now require Tier 3 verification
- Virtual cards require Tier 3 verification
- Frontend shows "Tier 3 Required" message with upgrade instructions

**Virtual Cards Features:**
- Create VISA/Mastercard virtual cards
- Fund cards from USD balance
- Withdraw from card to USD balance
- Freeze/unfreeze cards
- View card details and transactions

**Card Fee Structure (Admin Adjustable):**
| Fee Type | Default | Description |
|----------|---------|-------------|
| Creation Fee | $2.50 | One-time fee to create a card |
| Funding Fee | $0.30 | Fee per funding operation |
| Transaction Fee | $0.15 | Fee per successful transaction |
| Declined Fee | $0.50 | Fee when transaction is declined |
| Monthly Fee | $0.50 | Monthly maintenance fee |
| Withdrawal Fee | $0.10 | Fee to withdraw from card |

**New API Endpoints:**
- `GET /api/cards` - List user's virtual cards
- `POST /api/cards/create` - Create a new virtual card
- `POST /api/cards/fund` - Fund a card from USD balance
- `POST /api/cards/withdraw` - Withdraw from card to USD balance
- `GET /api/cards/{card_id}` - Get card details
- `GET /api/cards/{card_id}/transactions` - Get card transactions
- `POST /api/cards/{card_id}/freeze` - Freeze a card
- `POST /api/cards/{card_id}/unfreeze` - Unfreeze a card
- `POST /api/webhooks/payscribe/cards` - Card webhook handler

**Admin Endpoints:**
- `GET /api/admin/cards` - List all virtual cards
- `GET /api/admin/card-fees` - Get card fee configuration
- `PUT /api/admin/card-fees` - Update card fees

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
None currently - Payscribe payout API integration is now working!

### P1 (High Priority)
- **Bill Payments PIN**: PIN protection not yet implemented for Data, Airtime, TV, Betting (only Bank Transfer has PIN)
- **Payscribe Bill Payments**: Data/TV/Electricity may still return 401 if secret key doesn't have permissions

### P2 (Medium Priority)
- Refactor monolithic server.py into modular routers
- Break down large NewDashboard.js into smaller components
- Mobile horizontal scroll on Reseller Portal

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
