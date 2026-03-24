# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-24 (Session 17)**: P0 Bug Fixes + Travel Section Verification
  - **FIXED:** Tiger SMS phone number parsing — `str(result).split(':')` on a parsed dict produced garbage. Now uses `result.get('phone_number')` directly.
  - **FIXED:** Tiger SMS purchase condition check — uses `result.get('success')` instead of fragile string check.
  - **FIXED:** SMS Bower V2 API JSON parsing — `getNumberV2` returns JSON `{activationId, phoneNumber, ...}` but code only checked for `ACCESS_NUMBER:id:phone` text format. Now parses both JSON and legacy formats.
  - **FIXED:** Error messages sanitized — no longer expose provider names (e.g., 'SMS Bower error', 'Tiger SMS error'). Now show generic messages like "No numbers available. Please try another server."
  - **FIXED:** Text Verified timer changed from 10 min default to 5 min max.
  - **FIXED:** Phone number formatting — added `formatPhoneNumber()` helper that cleans malformed data (e.g., `'999...', 'phone_number'`) and adds `+` prefix to all numbers.
  - **FIXED:** Country display added — `getCountryName()` maps numeric/text codes to readable country names. Shown in both mobile cards and desktop table.
  - **FIXED:** Server name column added to verification table — shows Server 1, Budget Server, Fast Server, Premium Server.
  - **FIXED:** Country column added to desktop verification table.
  - **FIXED:** Removed colored background from bottom sheet modal cards (bg-white instead of bg-slate-100).
  - **FIXED:** Updated `PROVIDER_TO_SERVER` mapping and `list_orders` server_names to match frontend names.
  - **VERIFIED:** Travel Section overhaul working correctly — dynamic search, multi-city, Flights/Stays/Car Rentals/Attractions tabs, theme colors.
  - Files modified: `/app/backend/server.py`, `/app/frontend/src/components/VirtualNumbersSection.js`

- **2026-03-08 (Session 16b)**: Provider/Operator Selection Modal Implementation
  - Bottom sheet modal for 5sim and SMS Bower operator/provider selection
  - Timers: 5sim=20min, SMS Bower=25min, Text Verified=5min, default=10min
  - Backend endpoints for operator/provider fetching
  - Purchase flow includes selected operator

- **2026-03-08 (Session 16)**: SMS Provider Service Names Rework
  - SMS Bower integration refactored to correct API endpoints
  - Tiger SMS full service names (400+ mappings)

## Known Issues

### P1 (High Priority)
- **"Make Admin" button** not working on live server
- **Bill Payments PIN**: PIN protection not yet implemented for Data, Airtime, TV, Betting

### P2 (Medium Priority)
- Reseller Portal horizontal scroll issue on mobile
- End-to-end virtual card creation flow untested
- KYC verification retry flow untested
- Payscribe webhook fee handling untested
- Refactor monolithic server.py into modular routers
- Break down large React components

## Upcoming Tasks
- **P0:** Secure all bill payments with a transaction PIN
- **P1:** Refactor monolithic server.py using APIRouter
- **P2:** Break down large React components

## Future/Backlog
- Gift card store filtering by category/brand
- GitHub Actions CI/CD workflow
- Account lockout after failed login attempts

## Technology Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Authentication**: JWT + Transaction PIN
- **Payments**: Ercaspay, Payscribe, PaymentPoint, Plisio
- **SMS Providers**: 5sim, smspool, daisysms, Tiger SMS, SMS Bower, Text Verified
- **Travel**: Amadeus API

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

## Files of Reference
- /app/backend/server.py — Main backend
- /app/frontend/src/components/VirtualNumbersSection.js — Virtual numbers with provider modal
- /app/frontend/src/components/TravelSection.js — Travel booking section
- /app/frontend/src/pages/NewDashboard.js — Main dashboard
