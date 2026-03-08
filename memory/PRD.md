# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-08 (Session 14)**: SMS Provider Rework - New Pages and Provider Integrations
  - NEW: **US Numbers Page** - Card-based UI with 4 providers:
    - Text Verified (Premium), 5sim (Popular), SMS Bower (Budget), Tiger SMS (Fast)
    - Provider cards with badges, descriptions, and feature tags
    - Service dropdown appears when provider selected
    - Price display in NGN with admin-configurable markup
  - NEW: **Global Numbers Page** - Card-based UI with 3 providers:
    - SMS Pool (Popular), 5sim (Reliable), SMS Bower (Budget)
    - Country dropdown followed by service dropdown
    - Country flags displayed in dropdown options
  - NEW: **Provider Enable/Disable Toggles** - Admin can toggle individual providers:
    - DaisySMS (deprecated, disabled by default), SMS Pool, 5sim, Tiger SMS, SMS Bower, Text Verified
    - Toggle cards show enabled/disabled state with color coding
  - NEW: **SMS Bower Integration** - Backend endpoints and polling:
    - GET `/api/services/smsbower` - Get services with pricing
    - Purchase, poll OTP, and cancel functions
    - Markup configurable in admin panel
  - NEW: **Text Verified Integration** - Backend endpoints with bearer token auth:
    - GET `/api/services/textverified` - Get services (US only)
    - Purchase, poll OTP, and cancel functions
    - Requires API key + email for authentication
  - NEW: **Provider Status API** - GET `/api/services/providers/status`
    - Returns enabled/disabled status for all 6 providers
    - Used by frontend to show/hide provider cards
  - NEW: **Admin Panel SMS Providers Section Updates**:
    - Provider Availability card with 6 toggle cards
    - New markup fields: SMS Bower Markup (%), Text Verified Markup (%)
    - New API key fields: SMS Bower API Key, Text Verified API Key/Email
    - NEW badges on SMS Bower and Text Verified
  - PRESERVED: **All Numbers page** (VirtualNumbersSection) unchanged
  - Files: `/app/frontend/src/components/USNumbersSection.js`, `/app/frontend/src/components/GlobalNumbersSection.js`


- **2026-02-18 (Session 13)**: Travel Section Major Improvements
  - NEW: **Dynamic Airport/City Search** - Uses Amadeus API `/v1/reference-data/locations/cities` endpoint
    - Real-time search as you type with debouncing
    - Wide dropdown (400-500px) matching Booking.com design
    - Shows airports with plane icons, cities with building icons
    - Country tags, airport codes with theme-colored badges
    - Fallback to static list (649 airports) if API unavailable
  - NEW: **Multi-city Flight Search** - Added "Multi-city" trip type option
    - Flight 1, Flight 2, etc. segments with From/To/Date
    - "+ Add another flight" button (up to 6 flights)
    - Remove segment with trash icon
  - NEW: **Dynamic Theme Colors** - Travel section uses app's primary color (from branding/admin)
    - Header, buttons, badges, icons all adapt to theme
    - No more hardcoded blue (#003580)
  - IMPROVED: **Exchange Rate Hidden** - Removed from user-facing UI
    - Rate still used internally for USD to NGN conversion
    - Admin configurable via `ngn_to_usd_rate` in pricing config
  - IMPROVED: **649 Worldwide Airports** - Comprehensive list in `/app/backend/airports_data.py`
    - Nigeria (20+), West Africa, East Africa, Southern Africa
    - Middle East, Europe, Americas, Asia, Oceania
  - IMPROVED: **171 Cities** for Attractions/Experiences
  - FIXED: **Feature Unlock PIN** - Changed default to `11550099876`
  - NEW: Backend endpoint `GET /api/travel/search-locations?keyword=XXX&max=15`

- **2026-02-13 (Session 12 continued)**: Dashboard UI + Virtual Cards Redesign + Bill Markups
  - UI: **Removed top balance from dashboard header** - Balance is already shown in the balance card
  - UI: **Added refresh icon to header** - Users can quickly refresh their balance
  - UI: **Fixed "Add Money" button** - Text now comes first, plus icon on the right
  - NEW: **Completely redesigned Virtual Cards page** - Modern responsive UI matching reference design:
    - Overview/Transactions tabs
    - Card Balance section with live API sync and refresh button
    - Large card display with show/hide number & CVV
    - Mini card carousel for multiple cards
    - Recent Activity section
    - Fund card modal with quick amount buttons
    - Freeze/Unfreeze card functionality
  - NEW: **Additional Card Fee** - First card has creation_fee, second+ cards have additional_card_fee ($5 default)
    - Configurable from Admin Panel > Card Fees
  - FIX: **SMS OTP Polling** - Fixed API key usage to fetch from database config instead of hardcoded env variables
  - NEW: **Bill Payment Markups** - Admin can set hidden profit margins on airtime, data, TV, electricity, betting

- **2026-02-06 (Session 11)**: Deployment Documentation + Admin UI Improvements
  - NEW: **DEPLOYMENT.md** - Comprehensive deployment guide with clear instructions for both sites:
    - Separate commands for GetUCloudy (`docker compose up`) and SocialSMSWorld (`docker compose -f docker-compose.socialsmsworld.yml up`)
    - Container name conventions explained (ultracloud-* vs socialsms-*)
    - Troubleshooting section for common deployment issues
    - Quick reference commands for each site
  - IMPROVED: **Make Admin Button** - Better feedback with success/error toast notifications
    - Shows "Made user an admin" / "Removed admin status" on success
    - Shows specific error message on failure
    - Console logging for debugging
  - VERIFIED: Backend API for admin toggles (is_admin, is_suspended, is_blocked) working correctly
  
- **2026-02-06 (Session 10)**: KYC Tier Logic + Admin Fixes + Virtual Card Fix
  - NEW: **KYC Settings Admin UI** - Admin Panel now has "KYC Settings" section under Configuration:
    - Configure verification fees for each KYC tier (Tier 1, 2, 3)
    - Configure maximum wallet balance limits for each tier
    - Auto-suspension logic: Users exceeding their tier's balance limit are auto-suspended
    - Suspension banner on dashboard prompting KYC upgrade
    - Unsuspend automatically when user upgrades KYC tier
  - NEW: **Dynamic KYC Tier Limits** - All tier limits and fees now read from admin config:
    - Account Tier Status in Profile shows admin-configured limits (not hardcoded)
    - Express KYC fee now reads from config (kyc_tier3_fee)
    - All frontend tier displays use branding.kyc_tier{1,2,3}_max_balance
    - Backend KYC status endpoint returns dynamic limits from config
  - NEW: **User Search in Admin Panel** - Search users by email, name, or phone
  - NEW: **KYC Document Viewing** - View Selfie and ID document links in user edit modal
  - NEW: **Admin Link Card Services** - Admin can manually link Payscribe card services for Tier 3 users
    - New endpoint: POST `/api/admin/users/{user_id}/link-card-services`
    - "Link Cards" button appears in admin Users list for eligible users
  - FIXED: **Virtual Cards Error Handling** - Now shows helpful message when user is Tier 3 but doesn't have card services linked
  - FIXED: **Case-insensitive email login** - Login now uses MongoDB regex with `$options: 'i'`
  - FIXED: **Admin user toggle not working** - User edit modal checkboxes properly initialize state
  - FIXED: **Service card navigation** - Dashboard cards open Bills Payment with correct tab active
- **2026-02-06 (Session 9)**: Homepage 2 Admin Customization
  - NEW: Admin Panel controls for Homepage 2 (SocialSMS) only:
    - **Colors:** Background color, Accent color (start/end gradient)
    - **Effects:** Glassmorphism toggle, Animated background toggle
    - **Hero Badge:** Enable/disable, customizable text
    - **Navigation:** Login button style (bordered/solid)
    - **Content:** 3 hero typing phrases, hero subtitle
    - **Live Preview:** Shows badge and button with selected colors
  - These settings ONLY affect Homepage 2, not the default homepage
  - Backend: Added hp2_* fields to PricingConfig and BrandingUpdate
  - Frontend: LandingSocialSMS now reads all styling from branding config
- **2026-02-06 (Session 9)**: UI Fixes + Individual Bill Toggles
  - NEW: Dark theme for SocialSMS landing page with purple gradient accents, glassmorphism effects, and animated backgrounds
  - NEW: Individual bill payment toggles in Admin Panel (Data, TV, Electricity, Airtime)
  - FIXED: KYC navigation - now correctly goes to Profile > KYC tab instead of non-existent 'settings' section
  - FIXED: Service cards navigate to their respective pages instead of always going to bills-payment
  - Backend: Added disable_data, disable_tv, disable_electricity, disable_airtime_bills to PricingConfig
- **2026-02-05 (Session 9)**: Security Hardening
  - **Rate Limiting:** Added slowapi rate limiting on auth endpoints:
    - Registration: 5/minute
    - Login: 10/minute  
    - Forgot password: 3/minute
    - Reset code verification: 5/minute
  - **Security Headers:** Added middleware for X-Frame-Options (DENY), X-Content-Type-Options (nosniff), X-XSS-Protection, Referrer-Policy, Permissions-Policy
  - **Path Traversal Protection:** File serving endpoints now validate filenames and prevent directory traversal attacks
  - **KYC Files Protected:** KYC documents now require admin authentication to access
  - **Secure File Uploads:** 
    - Extension derived from content-type (not filename)
    - File size validation
    - UUID-based filenames (never use user input)
  - **NoSQL Injection Prevention:** All $regex queries now use re.escape() on user input
  - **JWT Secret:** Removed hardcoded fallback - now generates random secret if not set (with warning)
  - **API Keys:** Removed all hardcoded default API keys from code
  - **Secure Random:** Password reset codes now use secrets.randbelow() instead of random.randint()
- **2026-02-05 (Session 9)**: Favicon + Dynamic Banner Carousel Upload
  - NEW: Favicon upload in Admin Panel (Branding & Banners section)
  - NEW: Banner image file upload - each carousel banner can now be uploaded directly instead of just URL
  - NEW: Banner preview thumbnail shown in admin panel
  - ENHANCED: Dashboard carousel is fully dynamic - number of slides matches uploaded banners
  - Backend endpoints added: `/api/admin/upload-favicon`, `/api/admin/upload-banner`
  - Favicon automatically updates in browser tab when uploaded
- **2026-02-05 (Session 9)**: Login/Signup Button Fix + Admin User Edit Fix
  - FIXED: Login and Sign Up buttons on `LandingSocialSMS.js` homepage now correctly open the auth modal
  - FIXED: Removed undefined variables (`email`, `setEmail`, etc.) that were causing ReferenceError
  - FIXED: Replaced non-existent `navigate()` calls with proper `setShowAuth()` and `setIsLogin()` 
  - ADDED: Complete auth modal (login/register forms) to `LandingSocialSMS.js` component
  - ADDED: Forgot password modal to `LandingSocialSMS.js` component
  - FIXED: Admin Panel user edit functionality was not working due to:
    - `openUserEditor(u)` not being called when Edit button was clicked (editUser state not initialized)
    - `saveUserEdits()` using async state (selectedUser) instead of direct user ID
  - Solution: Added onClick handler to Edit button trigger, modified saveUserEdits to accept userId parameter
- **2026-02-02 (Session 8 - Part 2)**: Virtual Card Cleanup + Bank Transfer Admin + BVN/NIN Duplicate Check
  - FIXED: Virtual Card now shows only logo, removed brand name text from card display
  - NEW: Admin toggle to disable Bank Transfer for ALL users (separate from bill payments toggle)
  - NEW: BVN/NIN duplicate check - prevents same BVN/NIN from being used by multiple accounts
  - NEW: Both exchange rates (USD→NGN and NGN→USD) are now editable from admin panel
  - NEW: Verification address displayed read-only on user profile page (for Tier 3 users)
  - FIXED: kyc_address now saved during NIN verification and returned in user profile
- **2026-02-02 (Session 8)**: Critical Fixes + Currency Conversion + Admin Bill Toggle
  - FIXED: Bill payment service cards now navigate to bills-payment section (not blank page)
  - FIXED: Logo size in dashboard header increased (h-14 sm:h-16 lg:h-20)
  - FIXED: Selfie camera stream attachment improved for live preview
  - NEW: Bidirectional currency conversion (USD↔NGN)
  - NEW: Admin can disable ALL bill payment services with master toggle
  - NEW: Backend /api/wallet/convert-ngn-to-usd endpoint
  - NEW: Exchange rate API returns both usd_to_ngn_rate and ngn_to_usd_rate
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

## Latest Updates (February 2, 2026)

### Session 8 Part 2 - Virtual Card + Bank Transfer Admin + KYC Security

**Virtual Card Cleanup:**
- Virtual card display now shows ONLY the logo image
- Removed brand name text that appeared next to the logo
- Cleaner, more professional card appearance

**Admin Bank Transfer Toggle:**
- Admin Panel → Page Toggles now has separate "Disable Bank Transfer" toggle (orange card)
- When enabled, Bank Transfer option is hidden from Bills Payment section for ALL users
- Separate from the "Disable ALL Bill Payments" toggle - allows granular control

**BVN/NIN Duplicate Prevention:**
- BVN verification now checks if BVN is already registered with another verified account
- NIN verification now checks if NIN is already registered with another verified account
- Returns clear error message: "This BVN/NIN is already registered with another account"

**Exchange Rate Configuration:**
- Admin panel now shows BOTH exchange rate inputs:
  - USD → NGN rate (for wallet conversion)
  - NGN → USD rate (for reverse conversion)
- Preview amounts shown for each rate

**Verification Address Display:**
- User profile page now shows "Verification Address" section for Tier 3 verified users
- Address is read-only (street, city, state, postal code, country)
- Shows message explaining address cannot be edited - contact support to update
- kyc_address is saved during NIN verification and returned via /api/user/profile

### Session 8 - Critical Fixes + Currency Conversion + Admin Bill Toggle

**Bug Fixes:**
- Bill payment service cards (Internet Data, TV Sub, Electricity) now correctly navigate to `bills-payment` section
- Logo size in dashboard header increased from `h-10 sm:h-12` to `h-14 sm:h-16 lg:h-20`
- Selfie camera stream attachment improved with retry logic and proper `onloadedmetadata` handling

**Bidirectional Currency Conversion:**
- ConvertCurrencySection now has toggle between USD→NGN and NGN→USD modes
- Shows both exchange rates ($1 = ₦1,650 and ₦1,500 = $1)
- Quick amount presets adjusted per direction
- Backend `/api/wallet/convert-ngn-to-usd` endpoint added

**Admin Master Bill Toggle:**
- Admin Panel → Page Toggles now has "Disable ALL Bill Payments" master toggle
- When enabled, completely hides: Airtime, Data, Electricity, TV, Betting from dashboard
- Affects both sidebar menu items and Quick Services cards
- Clear status indicator: "⛔ ALL BILL SERVICES HIDDEN" or "✅ BILL SERVICES VISIBLE"

## Previous Updates (January 27, 2026)
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
