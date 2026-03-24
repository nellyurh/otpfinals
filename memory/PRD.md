# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-24 (Session 17b)**: API Key Decryption + ₦500 Minimum Price Fix
  - **FIXED:** SMS Bower API keys — All 10 occurrences of `config.get('smsbower_api_key')` changed to `get_api_key(config, 'smsbower_api_key', '')` which handles Fernet decryption. This was causing SMS Bower failures on the deployed Contabo server where keys are encrypted.
  - **FIXED:** Tiger SMS API keys already used `get_api_key()` correctly (8 occurrences verified).
  - **FIXED:** ₦500 minimum price enforced across ALL servers:
    - Backend: `calculate-price` and `purchase` endpoints now enforce `final_price_ngn >= 500`
    - Frontend: `enforceMinPrice()` helper applied to ALL 13+ price display points (service dropdowns, total cost, pool selection, operator selection, bottom sheet modal)
  - **FIXED:** All error messages sanitized — zero provider names (SMS Bower, Tiger SMS, Text Verified, 5sim) exposed in user-facing errors. Generic messages like "No numbers available. Please try another server."
  - **FIXED:** SMS Bower V2 API JSON parsing — `getNumberV2` returns JSON `{activationId, phoneNumber}`, now parsed correctly alongside legacy `ACCESS_NUMBER:id:phone` format.
  - **FIXED:** Text Verified timer set to 5 minutes (was 10 min default).
  - **FIXED:** Phone number formatting — `formatPhoneNumber()` cleans malformed data and adds `+` prefix.
  - **FIXED:** Country display added to order cards (mobile + desktop).
  - **FIXED:** Server name column in verification table.
  - Files modified: `/app/backend/server.py`, `/app/frontend/src/components/VirtualNumbersSection.js`

- **2026-03-24 (Session 17a)**: Tiger SMS Phone Parsing + Travel Verification
  - Fixed Tiger SMS phone number parsing (str(dict).split(':') bug)
  - Verified Travel Section overhaul working correctly

## Known Issues

### P1 (High Priority)
- **"Make Admin" button** not working on live server
- **Bill Payments PIN**: PIN protection not yet implemented

### P2 (Medium Priority)
- Reseller Portal horizontal scroll issue on mobile
- End-to-end virtual card creation flow untested
- KYC verification retry flow untested
- Payscribe webhook fee handling untested
- Refactor monolithic server.py into modular routers
- Break down large React components

## Timer Durations
| Provider | Timer |
|----------|-------|
| 5sim | 20 minutes |
| SMS Bower | 25 minutes |
| Text Verified | 5 minutes |
| Tiger SMS | 10 minutes (default) |
| Others | 10 minutes (default) |

## Server Name Mappings (User-Facing)
| Provider | Server Name |
|----------|-------------|
| Text Verified | Premium Server |
| 5sim | Server 1 |
| SMS Bower | Budget Server |
| Tiger SMS | Fast Server |
| DaisySMS | US Server |
| SMSPool | Server 1 |

## Price Rules
- **Minimum ₦500** enforced on ALL services across ALL servers
- Applied at: Backend (calculate-price, purchase) + Frontend (all display points)

## Files of Reference
- /app/backend/server.py — Main backend
- /app/frontend/src/components/VirtualNumbersSection.js — Virtual numbers
- /app/frontend/src/components/TravelSection.js — Travel section
- /app/frontend/src/pages/NewDashboard.js — Main dashboard
