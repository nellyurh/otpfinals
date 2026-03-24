# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-24 (Session 18)**: Promo Code for New Providers + ₦500 Floor Verification
  - **FIXED:** `calculate-price` endpoint now supports all new provider server names (tigersms_us, tigersms_global, smsbower_us, smsbower_global, textverified_us, 5sim_us, 5sim_global)
  - **FIXED:** Promo code input added to US Numbers and Other Countries provider card UI (was completely missing)
  - **VERIFIED:** ₦500 minimum floor works correctly in both calculate-price and purchase endpoints for all providers
  - **VERIFIED:** Promo code discounts apply correctly on new provider modes via calculate-price API
  - **NOTE:** Old orders in DB showing below-₦500 charged_amount were created before floor fix was deployed

- **2026-03-24 (Session 17d)**: Provider Name Hiding + Pricing + Orders Fix
  - **FIXED:** Provider names hidden from ALL API responses. `/api/services/providers/status` now returns server names (Premium Server, Server 1, Budget Server, Fast Server) instead of real names (Tiger SMS, SMS Bower, etc.)
  - **FIXED:** `provider` and `server` fields removed from `/api/orders/list` and `/api/orders/{id}` responses. Only `server_name` is exposed.
  - **FIXED:** Orders list now filters by `status: 'active'` only — cancelled/expired orders no longer shown.
  - **FIXED:** Text Verified phone numbers no longer have `+` prefix. All other providers keep `+`.
  - **FIXED:** ₦500 minimum is a proper FLOOR — prices below ₦500 rounded up, prices above ₦500 unchanged. Applied in both calculate-price and purchase endpoints.
  - **FIXED:** Promo code now sent in provider card purchase flow (was missing from payload).
  - **FIXED:** Timer uses `server_name` instead of `provider`/`server` fields (which are removed from response).
  - **FIXED:** Individual order GET endpoint also hides provider/server, adds server_name.

- **2026-03-24 (Session 17c)**: Double Encryption Prevention
  - All sensitive fields masked to `********` in admin GET using `SENSITIVE_FIELDS` constant
  - `ENC:` guard on all save conditions prevents re-encryption

- **2026-03-24 (Session 17b)**: API Key Decryption + ₦500 Minimum
  - SMS Bower API key decryption fixed (10 occurrences)
  - Frontend `enforceMinPrice()` applied to all 13+ price displays

- **2026-03-24 (Session 17a)**: Tiger SMS Phone Parsing + Travel Verification
  - Tiger SMS phone number parsing fixed
  - Travel Section verified working

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

## Known Issues
### P1
- "Make Admin" button not working on live server
- Bill Payments PIN not yet implemented

### P2
- Reseller Portal horizontal scroll on mobile
- Virtual card e2e untested
- KYC retry flow untested

## Files of Reference
- /app/backend/server.py
- /app/frontend/src/components/VirtualNumbersSection.js
- /app/frontend/src/components/TravelSection.js
