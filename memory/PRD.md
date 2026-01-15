# UltraCloud SMS - Product Requirements Document

## Original Problem Statement
Build a full-stack OTP service platform with JWT auth, wallet system, multiple payment gateways, and admin panel.

## Latest Updates (January 15, 2026)

### Session 4 - Bug Fixes & New Features

**All Reported Issues Fixed:**

1. **API Documentation Page Exits After Sometime - FIXED** ✅
   - Root cause: `showDocs` state was inside nested ResellerSection, reset on parent re-render
   - Solution: Moved `showResellerDocs` state to parent `NewDashboard` component level
   - Docs now persist when navigating away and back

2. **API URL Should Be Configurable from Admin - FIXED** ✅
   - Added `reseller_api_base_url` field to PricingConfig model
   - Added "API Documentation Settings" card in Admin > Resellers section
   - API URL is saved via `/admin/pricing` endpoint and exposed via `/public/branding`
   - User dashboard fetches and uses the admin-configured URL in API docs

3. **Promo Code Validation Not Working - FIXED** ✅
   - Fixed `/promo/validate` endpoint to return proper validation result
   - Made `country` field optional in `CalculatePriceRequest` (was required, blocking DaisySMS)

4. **5sim Buy Error but Number Was Bought - FIXED** ✅
   - Root cause: Purchase endpoint reset `phone_number = None` after 5sim response parsing
   - Solution: Added explicit case handling for 5sim provider in phone number parsing

5. **Admin OTP Sales Page - IMPLEMENTED** ✅
   - New "OTP Sales" section in admin sidebar
   - Stats cards: Total Orders, Total Revenue, Today's Orders, Today's Revenue
   - Order Status Breakdown: Active, Completed, Cancelled, Expired, Refunded counts
   - Orders table with User, Service, Phone, OTP, Price, Provider, Status, Date
   - Status filter dropdown
   - View button with detailed order modal (all order fields + SMS text)
   - Backend endpoints: `/admin/otp-orders`, `/admin/otp-stats`

**Note on Canceled SMS Income:**
Canceled/refunded orders are NOT counted in revenue calculations. The `total_revenue_ngn` is calculated from `status: 'completed'` orders only.

### Previous Session Fixes (Still Working)
- ✅ Reseller Portal stable (no infinite reload)
- ✅ Admin branding colors save and apply to landing page
- ✅ SMS History page working
- ✅ 5sim-style API documentation with Shell/Python/PHP tabs

## Current State Summary
- ✅ Landing page with dynamic admin colors
- ✅ Reseller Portal with persistent API docs
- ✅ Admin-configurable API base URL
- ✅ Promo code validation working
- ✅ 5sim purchases working correctly
- ✅ **NEW** Admin OTP Sales page with full functionality
- ✅ Admin panel with 7 sections (added OTP Sales)

## Admin Panel Sections
1. Dashboard
2. Page Toggles
3. Payment Gateways
4. Promo Codes
5. Branding & Banners
6. SMS Providers
7. Resellers (with API URL setting)
8. **OTP Sales** (NEW)

## Testing Credentials
- Admin: `admin@smsrelay.com` / `admin123`

## API Endpoints Added
- `GET /api/admin/otp-orders` - List all OTP orders with user info
- `GET /api/admin/otp-stats` - OTP sales statistics
- `PUT /api/admin/pricing` - Now accepts `reseller_api_base_url`
- `GET /api/public/branding` - Now returns `reseller_api_base_url`

## Key Files Modified
- `/app/frontend/src/pages/NewDashboard.js` - showResellerDocs + resellerApiBaseUrl states
- `/app/frontend/src/pages/AdminPanel.js` - OTP Sales section + API URL setting
- `/app/backend/server.py` - OTP endpoints, 5sim fix, promo fix, country optional

## Test Reports
- `/app/test_reports/iteration_4.json` - 100% pass rate (17/17 backend, all frontend)
- `/app/tests/test_iteration4_features.py` - Backend test suite

## Upcoming Tasks (P1)
- Complete Profile Settings functionality
- Complete Referral page functionality
- Finalize Admin User Management (Edit user)

## Future Tasks (P2-P3)
- Refactor server.py into modular APIRouter structure
- Refactor NewDashboard.js and AdminPanel.js into smaller components
- Fix lower-priority issues (Ercaspay focus, Bank Accounts page)
