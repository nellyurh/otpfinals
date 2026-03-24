# UltraCloud SMS - Product Requirements Document

## Changelog
- **2026-03-24 (Session 17c)**: Critical Security Fix — Double Encryption Prevention
  - **ROOT CAUSE:** `get_pricing_config` GET endpoint had a HARDCODED masking list missing `smsbower_api_key`, `textverified_api_key`, `textverified_email`, and `amadeus_*` keys. These encrypted (`ENC:gAAAAA...`) values were returned raw to the admin frontend. When admin saved settings, these values were re-encrypted, breaking the keys permanently.
  - **FIX 1 (GET):** Replaced hardcoded masking list with `SENSITIVE_FIELDS` constant. Now ALL sensitive fields are masked to `********` when they contain `ENC:` prefix.
  - **FIX 2 (PUT):** Added `not data.xxx.startswith('ENC:')` guard to ALL 20+ sensitive field save conditions. Prevents double-encryption even if encrypted values somehow reach the save endpoint.
  - **FIX 3:** Added `smsbower_api_key`, `textverified_api_key`, `textverified_email`, `amadeus_api_key`, `amadeus_api_secret` to `SENSITIVE_FIELDS` constant.
  - **VERIFIED:** `********` values → skipped (no overwrite). `ENC:` values → skipped (no re-encryption). Only raw plaintext → encrypted.

- **2026-03-24 (Session 17b)**: API Key Decryption + ₦500 Minimum Price
  - All 10 SMS Bower `config.get()` calls → `get_api_key()` for decryption
  - ₦500 minimum price enforced in backend (calculate-price, purchase) and frontend (13+ display points)
  - Error messages sanitized — no provider names exposed
  - SMS Bower V2 JSON parsing fixed
  - Text Verified timer → 5 min

- **2026-03-24 (Session 17a)**: Tiger SMS Phone Parsing + Travel Verification
  - Fixed Tiger SMS phone parsing, server names, country display, modal backgrounds

## Known Issues
### P1
- "Make Admin" button not working on live server
- Bill Payments PIN not yet implemented

### P2
- Reseller Portal horizontal scroll on mobile
- Virtual card creation e2e untested
- KYC retry flow untested
- Payscribe webhook fee handling untested

## Upcoming Tasks
- P0: Secure bill payments with transaction PIN
- P1: Refactor server.py into modular APIRouter
- P2: Break down large React components

## Security: Sensitive Fields
All fields in `SENSITIVE_FIELDS` constant are:
- Encrypted on save via `encrypt_secret()`
- Masked to `********` in admin GET responses
- Protected from double-encryption with `ENC:` guard on save
- Decrypted on read via `get_api_key()`

## Files of Reference
- /app/backend/server.py
- /app/frontend/src/components/VirtualNumbersSection.js
- /app/frontend/src/components/TravelSection.js
