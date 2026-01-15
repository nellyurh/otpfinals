# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

### Session 5 - Reseller Sales Page & API Fixes

**New Features:**

1. **Admin Reseller Sales Page - IMPLEMENTED** ✅
   - New "Reseller Sales" section in admin sidebar
   - Stats cards: Total Orders, Total Revenue, Today's Orders, Total Resellers, Active Resellers
   - Order Status Breakdown: Active, Completed, Cancelled, Expired, Refunded
   - All Reseller Orders table with View modal
   - Status filter functionality
   - Backend endpoints: `/admin/reseller-orders`, `/admin/reseller-sales-stats`

**Bug Fixes:**

2. **Reseller Countries Endpoint Returning Empty - FIXED** ✅
   - Root cause: Used `api.sms-pool.com` instead of `api.smspool.net`
   - Also used database API keys instead of environment variables
   - Fixed to use `SMSPOOL_API_KEY` and `FIVESIM_API_KEY` from environment
   - Now returns 151 countries for SMS-pool, 154 countries for 5sim

3. **Reseller Services Endpoint (USA/DaisySMS) Returning Empty - FIXED** ✅
   - Root cause: Wrong JSON parsing - looking for `data.get('187')` but format is `data[service_code]['187']`
   - Fixed to iterate correctly over DaisySMS response format
   - Now returns 442 services for USA server

**Reseller API Status - ALL WORKING:**
- ✅ `/api/reseller/v1/balance` - Returns balance, currency, plan
- ✅ `/api/reseller/v1/servers` - Returns 3 servers (usa, all_country_1, all_country_2)
- ✅ `/api/reseller/v1/countries?server=all_country_1` - Returns 151 countries (SMS-pool)
- ✅ `/api/reseller/v1/countries?server=all_country_2` - Returns 154 countries (5sim)
- ✅ `/api/reseller/v1/services?server=usa` - Returns 442 services (DaisySMS)
- ✅ `/api/reseller/v1/services?server=all_country_1&country=1` - Returns 1187 services (SMS-pool)
- ✅ `/api/reseller/v1/buy` - Purchase number
- ✅ `/api/reseller/v1/status` - Check order/get OTP
- ✅ `/api/reseller/v1/cancel` - Cancel order

### Previous Session Fixes (Still Working)
- ✅ API Documentation page persistence (showResellerDocs at parent level)
- ✅ Admin-configurable API URL
- ✅ Promo code validation
- ✅ 5sim phone number parsing
- ✅ OTP Sales admin page

## Admin Panel Sections (9 total)
1. Dashboard
2. Page Toggles
3. Payment Gateways
4. Promo Codes
5. Branding & Banners
6. SMS Providers
7. Resellers (with API URL setting)
8. OTP Sales
9. **Reseller Sales** (NEW)

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`
- Test Reseller API Key: `rsk_9cdb16694e964427991ff3209e029a38`

## Key Files Modified
- `/app/backend/server.py` - Fixed reseller endpoints, added reseller-orders/stats admin endpoints
- `/app/frontend/src/pages/AdminPanel.js` - Added Reseller Sales section

## Upcoming Tasks (P1)
- Complete Profile Settings functionality
- Complete Referral page functionality
- Finalize Admin User Management (Edit user)

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure
- Refactor NewDashboard.js and AdminPanel.js into smaller components
