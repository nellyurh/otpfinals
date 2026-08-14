# UltraCloud SMS / SocialSMS World - Product Requirements Document

## Changelog

- **2026-08-14 (Session 19)**: Dark Monochrome Theme Redesign + TransactPay/Payscribe Diagnostics
  - **DONE:** Complete UI redesign to black & white monochrome theme across all pages
  - **DONE:** Dashboard, Sidebar, Header, Fund Wallet, Virtual Numbers, Bills Payment, Airtime, Virtual Cards, Admin Panel all converted to dark theme
  - **DONE:** Landing page (LandingSocialSMS.js) converted to dark theme — modals, sections, cards, forms
  - **DONE:** CSS variables in index.css updated to dark theme defaults
  - **DONE:** Select dropdown styles (react-select) updated to dark theme
  - **DONE:** Added admin diagnostic endpoints: `POST /api/admin/transactpay/test-connection` and `POST /api/admin/payscribe/test-connection`
  - **DONE:** TransactPay code fix: removed `Reference` field from payload (only `Alias` required per docs), added strict accountNumber validation (must be numeric), improved alias generation (user email prefix instead of truncated UUID)
  - **DIAGNOSED:** TransactPay returns `TRP...` alphanumeric strings — root cause: API key is TEST mode (`PGW-PUBLICKEY-TEST-...`), needs LIVE key
  - **DIAGNOSED:** Payscribe returns 500/401 — keys decrypt correctly but API rejects from preview server (likely IP whitelist issue)

- **2026-03-24 (Session 18)**: Promo Code for New Providers + ₦500 Floor Verification
  - **FIXED:** `calculate-price` endpoint supports all new provider server names
  - **FIXED:** Promo code input added to US Numbers and Other Countries provider card UI
  - **VERIFIED:** ₦500 minimum floor works correctly for all providers

- **2026-03-24 (Session 17d)**: Provider Name Hiding + Pricing + Orders Fix
  - Provider names hidden from ALL API responses
  - ₦500 minimum FLOOR applied in both backend and frontend
  - Orders list filters by active status only

- **2026-03-24 (Session 17c)**: Double Encryption Prevention
  - `ENC:` guard on all save conditions prevents re-encryption

- **2026-03-24 (Session 17b)**: API Key Decryption + ₦500 Minimum

- **2026-03-24 (Session 17a)**: Tiger SMS Phone Parsing + Travel Verification

## Server Name Mappings
| Internal ID | User-Facing Name |
|-------------|------------------|
| textverified | Premium Server |
| 5sim | Server 1 |
| smsbower | Budget Server |
| tigersms | Fast Server |
| daisysms | US Server |
| smspool | Server 2 |

## Timer Durations (by server_name)
| Server Name | Timer |
|-------------|-------|
| Server 1 (5sim) | 20 minutes |
| Budget Server (smsbower) | 25 minutes |
| Premium Server (textverified) | 5 minutes |
| Others | 10 minutes (default) |

## Price Rules
- ₦500 minimum FLOOR on all services (round up cheap, don't cap expensive)
- Applied at: Backend (calculate-price, purchase) + Frontend (enforceMinPrice display)

## Security Rules
- Provider names NEVER exposed in API responses (only server names)
- `provider` and `server` fields stripped from order responses
- All API keys encrypted with Fernet, masked as `********` in admin panel
- `ENC:` guard prevents double-encryption on save
- Error messages sanitized — no provider names in user-facing errors

## UI Theme
- **Dark Monochrome**: Black backgrounds (#000000, #0a0a0a, #18181b, #09090b), white text, zinc accents
- Primary action buttons: white bg with black text
- Active sidebar item: white bg with black text
- Cards: bg-zinc-900 with border-zinc-800
- Inputs: bg-zinc-950 with border-zinc-700

## Known Issues
### P0 (Blocking)
- TransactPay returns TEST mode account numbers (TRP...) — **USER NEEDS LIVE API KEY**
- Payscribe API returning 500/401 — likely IP whitelist or account issue — **USER NEEDS TO VERIFY WITH PAYSCRIBE**

### P1
- "Make Admin" button not working on live server (works in preview)
- Bill Payments PIN not yet implemented
- Amadeus key encryption inconsistency

### P2
- Reseller Portal horizontal scroll on mobile
- Virtual card e2e untested
- KYC retry flow untested
- Payscribe webhook fee handling untested e2e

## Upcoming Tasks
1. Secure all bill payments with transaction PIN
2. Refactor server.py (16,000+ lines) into modular APIRouter structure
3. Break down AdminPanel.js (7,900+ lines) and NewDashboard.js (5,900+ lines)
4. Gift card store filtering by category/brand
5. Account lockout after failed login attempts

## Files of Reference
- /app/backend/server.py
- /app/frontend/src/pages/NewDashboard.js
- /app/frontend/src/pages/LandingSocialSMS.js
- /app/frontend/src/pages/AdminPanel.js
- /app/frontend/src/components/VirtualNumbersSection.js
- /app/frontend/src/components/FundWalletSection.js
- /app/frontend/src/components/BillPaymentSections.js
- /app/frontend/src/components/VirtualCardsSection.js
- /app/frontend/src/components/TravelSection.js
- /app/frontend/src/index.css
