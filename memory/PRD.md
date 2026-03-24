# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-24 (Session 17)**: P0 Bug Fixes + Travel Section Verification
  - **FIXED:** Tiger SMS phone number parsing was broken - `purchase_number_tigersms` returns a parsed dict but the main purchase endpoint was doing `str(result).split(':')` producing garbage phone numbers. Now uses `result.get('activation_id')` and `result.get('phone_number')` directly.
  - **FIXED:** Tiger SMS purchase condition check was using `'ACCESS_NUMBER' in str(result)` which is fragile. Now uses `result.get('success')`.
  - **FIXED:** Server names not displayed on active order cards. Updated `list_orders` endpoint `server_names` mapping to include new provider-based server values: tigersms_us -> 'Fast Server', 5sim_us -> 'Server 1', smsbower_us -> 'Budget Server', textverified_us -> 'Premium Server'.
  - **FIXED:** Added Server name display to both mobile card layout (next to service name) and desktop table layout (new Server column) in `VirtualNumbersSection.js`.
  - **FIXED:** Removed colored background (bg-slate-100) from bottom sheet modal provider cards, replaced with bg-white hover:bg-gray-50 for a cleaner look.
  - **FIXED:** Updated `PROVIDER_TO_SERVER` mapping to match frontend server names (5sim -> 'Server 1', smsbower -> 'Budget Server', textverified -> 'Premium Server', tigersms -> 'Fast Server').
  - **VERIFIED:** Travel Section overhaul working correctly:
    - Dynamic airport/city search with Amadeus API and static fallback
    - Round trip, One way, Multi-city flight search options
    - From/To fields with wide dropdown showing airports/cities with codes and country tags
    - Multiple tabs: Flights, Stays, Car Rentals, Attractions
    - Dynamic theme colors using app's primary color
    - Travel feature visibility controlled by admin toggle
  - Files modified: `/app/backend/server.py`, `/app/frontend/src/components/VirtualNumbersSection.js`

- **2026-03-08 (Session 16b)**: Provider/Operator Selection Modal Implementation
  - **NEW:** Bottom sheet modal for 5sim and SMS Bower operator/provider selection
    - Shows all available operators with individual prices sorted cheapest first
    - Displays delivery success rate percentage for 5sim operators
    - "Cheapest" badge on the lowest-priced option
    - Count of available numbers per operator
    - Both NGN and USD prices displayed
  - **NEW:** "Change" button to reopen operator selection modal after making a selection
  - **NEW:** "Select Operator" prompt appears when service is selected but no operator chosen
  - **FIXED:** Timers now provider-specific:
    - 5sim: 20 minutes
    - SMS Bower: 25 minutes  
    - Other providers: 10 minutes (default)
  - **NEW:** Backend endpoints:
    - `GET /api/services/smsbower/providers?country=X&service=Y` - Returns all providers for a service with prices
    - `GET /api/services/5sim/operators?country=X&service=Y` - Returns all operators with delivery rates
  - **UPDATED:** Purchase flow now includes selected provider_id for SMS Bower and operator for 5sim
  - Files modified: `/app/backend/server.py`, `/app/frontend/src/components/VirtualNumbersSection.js`, `/app/frontend/src/index.css`

- **2026-03-08 (Session 16)**: SMS Provider Service Names Rework (P0 Complete)
  - **FIXED:** SMS Bower integration completely refactored to use correct API endpoints
  - **FIXED:** Tiger SMS services now show full names instead of codes
  - **FIXED:** SMS Bower countries show proper names not numeric codes
  - **FIXED:** Frontend service dropdown was not displaying options
  - Files modified: `/app/backend/server.py`, `/app/frontend/src/components/VirtualNumbersSection.js`

- **2026-03-08 (Session 15)**: SMS Provider Database Caching Implementation
  - **FIXED:** Tiger SMS and SMS Bower providers now functional with database caching
  - **NEW:** Database caching for Tiger SMS - 20,960 services cached across 200 countries
  - **NEW:** Admin endpoints for provider sync

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
- Break down large NewDashboard.js into smaller components

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

## Files of Reference
- /app/backend/server.py - Main backend (heavily modified)
- /app/frontend/src/components/VirtualNumbersSection.js - Virtual numbers with provider modal
- /app/frontend/src/components/TravelSection.js - Travel booking section
- /app/frontend/src/pages/NewDashboard.js - Main dashboard
- /app/frontend/src/index.css - Custom styles including bottom-sheet animation
