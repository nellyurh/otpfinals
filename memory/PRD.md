# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 16, 2026)

### Session 7 - Bug Fixes & Verification

**Bug Fixes:**

1. **Ercaspay Input Losing Focus - FIXED** ✅
   - Root cause: Nested function component `FundWalletSection()` was redefined on every render
   - Solution: Changed from controlled input (value/onChange) to uncontrolled input (defaultValue/onBlur) pattern using useRef
   - Input now maintains focus when typing multiple digits

2. **Promo Code Creation Error - FIXED** ✅
   - Root cause: MongoDB `insert_one()` mutates the dictionary and adds `_id` (ObjectId), which is not JSON serializable
   - Solution: Added `doc.pop('_id', None)` after insert to remove the ObjectId before returning
   - Promo codes now create successfully via admin panel

3. **Bank Accounts Page - VERIFIED WORKING** ✅
   - Backend `/api/admin/virtual-accounts` endpoint returns correct data
   - Frontend displays 4 virtual accounts with User, Account, Bank columns
   - Issue was likely temporary or data-related in previous session

4. **Total OTP Volume Metric - VERIFIED WORKING** ✅
   - Admin dashboard displays correct ₦25,155 from `money_flow.total_sales_ngn`
   - Backend `/api/admin/stats` endpoint returns accurate data

5. **Canceled Order Income Logic - CONFIRMED CORRECT** ✅
   - When order is canceled/refunded, revenue is DECREMENTED (standard accounting)
   - Code: `{'$inc': {'total_revenue_ngn': -refund_amount, 'total_orders': -1}}`

### Session 6 - Reseller API Fixes & Branding

**Bug Fixes:**

1. **SMS-pool Services Prices Were 0.0 - FIXED** ✅
   - Root cause: `/service/retrieve_all` endpoint doesn't return prices
   - Solution: Use `/request/pricing` endpoint which returns prices
   - Now returns 1187 services with proper prices

2. **Reseller API Using Database Keys Instead of Env Vars - FIXED** ✅
   - Updated all reseller endpoints to use `SMSPOOL_API_KEY`, `FIVESIM_API_KEY`, `DAISYSMS_API_KEY` from environment
   - Affected endpoints: `/countries`, `/services`, `/buy`, `/status`, `/cancel`

3. **SMS-pool Parameter Names Wrong - FIXED** ✅
   - Changed `order_id` to `orderid` for `/sms/check` and `/sms/cancel` endpoints

4. **Provider Names Exposed to Users - FIXED** ✅
   - Added `PROVIDER_TO_SERVER` mapping: daisysms→"US Server", smspool→"Server 1", 5sim→"Server 2"
   - Added `get_server_name()` helper function
   - All order responses now include `server_name` field
   - Frontend admin panels display `server_name` instead of `provider`

5. **Error Messages Exposing Provider Names - FIXED** ✅
   - Changed "5sim: no free phones" → "No available numbers for this service/country"
   - Changed "5sim account balance insufficient" → "Provider balance insufficient"
   - Changed "Failed to purchase from 5sim" → "Failed to purchase number from server"

**Reseller API Tested & Working:**
- ✅ `/buy` - Successfully purchases numbers (tested with SMS-pool)
- ✅ `/status` - Returns order status and OTP when received
- ✅ `/cancel` - Successfully cancels and refunds
- ✅ `/services` - Returns proper prices (1187 for SMS-pool, 442 for DaisySMS)
- ✅ `/countries` - Returns 151 (SMS-pool) and 154 (5sim) countries

## Completed Features

### User Dashboard
- ✅ Virtual Numbers purchasing with multiple providers
- ✅ Fund Wallet (PaymentPoint, Ercaspay, Crypto via Plisio)
- ✅ SMS History with status tracking
- ✅ Transactions list
- ✅ Profile Settings (update name, phone, password)
- ✅ Referral Program (code, link, stats)
- ✅ Account Upgrade/KYC
- ✅ Reseller Portal with API documentation

### Admin Panel (11 sections)
1. Dashboard - KPIs, money flow, user behavior metrics
2. Page Toggles - Enable/disable features
3. Payment Gateways - Configure payment providers
4. Promo Codes - Create and manage promo codes
5. Branding & Banners - Site branding, colors, images
6. SMS Providers - Provider API keys and markups
7. Users - View, edit, suspend, block users
8. Deposits - View user deposits
9. Bank Accounts - View PaymentPoint virtual accounts
10. All Transactions - View all user transactions
11. Ercaspay Payments - View Ercaspay payment records
12. Popup Notifications - Create, edit, delete notifications
13. Resellers - Manage reseller plans and accounts
14. OTP Sales - Sales statistics and order history
15. Reseller Sales - Reseller sales statistics

## Provider to Server Mapping
| Provider | Server Name |
|----------|-------------|
| daisysms | US Server |
| smspool | Server 1 |
| 5sim | Server 2 |

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
- Test Reseller API Key: `rsk_9cdb16694e964427991ff3209e029a38`

## Key Files
- `/app/backend/server.py` - Main backend (5900+ lines)
- `/app/frontend/src/pages/AdminPanel.js` - Admin dashboard (3900+ lines)
- `/app/frontend/src/pages/NewDashboard.js` - User dashboard (3700+ lines)
- `/app/frontend/src/pages/Landing.js` - Landing page

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure (routes/admin.py, routes/reseller.py, etc.)
- Refactor NewDashboard.js into smaller components (FundWallet.js, SMSHistory.js, etc.)
- Refactor AdminPanel.js into smaller components (UserManagement.js, Notifications.js, etc.)
- Delete deprecated files: `/app/frontend/src/pages/NewAdminPanel.js`, `/app/frontend/src/pages/Dashboard.js`

## 3rd Party Integrations
- **DaisySMS** (OTP Service)
- **SMS-pool** (OTP Service)  
- **5sim** (OTP Service)
- **PaymentPoint** (NGN Virtual Accounts)
- **Payscribe** (Bill Payments)
- **Plisio** (Cryptocurrency Payments)
- **Ercaspay** (NGN Card/Bank Payments)

## Test Reports
- `/app/test_reports/iteration_5.json` - Latest test results (13/13 passed)
- `/app/tests/test_iteration5_features.py` - Backend tests
