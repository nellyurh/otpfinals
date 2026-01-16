# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 16, 2026)

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

### Previous Session Work
- ✅ Admin Reseller Sales page with stats and orders
- ✅ Admin OTP Sales page
- ✅ API Documentation persistence
- ✅ Admin-configurable API URL

## Provider to Server Mapping
| Provider | Server Name |
|----------|-------------|
| daisysms | US Server |
| smspool | Server 1 |
| 5sim | Server 2 |

## Admin Panel Sections (9 total)
1. Dashboard
2. Page Toggles
3. Payment Gateways
4. Promo Codes
5. Branding & Banners
6. SMS Providers
7. Resellers (with API URL setting)
8. OTP Sales
9. Reseller Sales

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
- Test Reseller API Key: `rsk_9cdb16694e964427991ff3209e029a38`

## Key Files Modified
- `/app/backend/server.py` - Provider mapping, env var usage, API fixes
- `/app/frontend/src/pages/AdminPanel.js` - server_name display

## Upcoming Tasks (P1)
- Complete Profile Settings functionality
- Complete Referral page functionality
- Finalize Admin User Management (Edit user)

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure
- Refactor NewDashboard.js and AdminPanel.js into smaller components
