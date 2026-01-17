# Legacy MariaDB -> MongoDB Mapping (Phase 1)

This document explains how the **old Jaysms / PHP MySQL schema** maps into
the **new FastAPI + MongoDB** app.

MongoDB remains the **main database**. We simply mirror your key MySQL tables
into Mongo collections so that:

- Old users can be imported once
- Balances come across into the new wallet
- Historical transactions and referral / promo data are preserved

The actual migration is implemented in:

- `backend/migrations/mysql_to_mongo.py`

You listed these Phase‑1 tables as must‑have:

- `user_data`
- `user_wallet`
- `user_transaction`
- `active_number`
- `tiger_number`
- `refer_data` / `refer_history`
- `promocode` / `promocode_history`

Below is how each maps into MongoDB.

---

## 1. `user_data` → `users` (main collection used by the app)

**MySQL columns**:
- `id` (int, PK)
- `name`
- `username`
- `email`
- `phone_number`
- `password` (hashed in old system)
- `type`
- `email_verified`
- `register_date`
- `image_url`
- `status`

**Mongo `users` document fields (relevant subset)**:
- `id` (string UUID) – primary ID used by the new app
- `legacy_user_id` (string) – original `user_data.id`
- `email`
- `full_name`
- `username`
- `phone`
- `ngn_balance` (float) – **set later** from `user_wallet.balance`
- `usd_balance` (float)
- `is_admin` (bool) – derived from `type == 'admin'`
- `email_verified` (copied)
- `status` (copied)
- `image_url` (copied)
- `created_at` (ISO string, from `register_date`)

**Key notes**:
- If a user with the same `email` already exists in Mongo, migration **reuses**
  that user and attaches `legacy_user_id` to it instead of creating a duplicate.
- Passwords are copied as part of existing user docs (where applicable), but
  verifying whether hashing algorithms match is a separate concern.

---

## 2. `user_wallet` → enrich `users` with balances

**MySQL columns**:
- `id`
- `user_id` (FK to `user_data.id`)
- `balance`
- `total_recharge`
- `total_otp`

**Mongo mapping** (to `users`):
- `ngn_balance`         ← `balance` (float)
- `legacy_total_recharge` ← `total_recharge` (float)
- `legacy_total_otp`    ← `total_otp` (int)

User lookup is via the `legacy_user_id → users.id` mapping created from
`user_data`.

---

## 3. `user_transaction` → `transactions`

**MySQL columns**:
- `id`
- `user_id`
- `amount`
- `date`
- `type`
- `receipt`
- `txn_id`
- `status`

**Mongo `transactions` documents**:
- `id` (UUID string) – new primary ID
- `user_id` – mapped via `legacy_user_id → users.id`
- `type`       ← `type`
- `amount`     ← `amount` (float)
- `currency`   = `"NGN"` (assumed for legacy rows)
- `status`     ← `status`
- `reference`  ← `txn_id`
- `created_at` ← from `date` (ISO string)
- `metadata`:
  - `receipt`                ← `receipt`
  - `legacy_transaction_id`  ← `id`
  - `source_table`           = `"user_transaction"`

The new app already uses the `transactions` collection for wallet and
service purchases; these imported rows simply appear as part of the
user's transaction history.

---

## 4. `active_number` → `active_number` (1:1 mirror)

**MySQL columns** (simplified):
- `id`
- `user_id`
- `number_id`
- `number`
- `server_id`
- `service_id`
- `order_id`
- `buy_time`
- `service_price`
- `service_name`
- `status`
- `sms_text`
- `active_status`

**Mongo collection**:
- Collection name: `active_number`
- Each row is copied as a document with the same field names
- `buy_time` is converted to an ISO string
- An extra field `_source_table = "active_number"` is added for traceability

These are **not** wired into the new `sms_orders` logic yet; they are
preserved as a legacy mirror so we can build views or reports later
without losing any information.

---

## 5. `tiger_number` → `tiger_number` (1:1 mirror)

**MySQL columns**:
- `id`, `user_id`, `number_id`, `number`, `service`, `price`,
  `otp`, `order_id`, `status`, `cancel_token`,
  `created_at`, `updated_at`

**Mongo collection**:
- Collection name: `tiger_number`
- Same fields copied 1:1
- `created_at` / `updated_at` → ISO strings
- `_source_table = "tiger_number"`

As with `active_number`, this preserves all TigerSMS-specific history
in its original form. Later, when we switch to **5sim**, we can decide
whether and how to unify this with the new provider's orders.

---

## 6. Referrals: `refer_data` / `refer_history`

Both tables are mirrored 1:1 into Mongo collections with the same
names and fields.

- `refer_data`    → `refer_data`
- `refer_history` → `refer_history`

Each document gets an additional `_source_table` field.

In future work, we can:
- Introduce a dedicated `referrals` model in FastAPI
- Hook the new **Referral Program** page to these collections

---

## 7. Promocodes: `promocode` / `promocode_history`

Again, both tables are mirrored directly:

- `promocode`          → `promocode` (with `date` converted to ISO string)
- `promocode_history`  → `promocode_history`

All original fields are preserved, plus `_source_table` for traceability.

Later, when we implement the **Promo / Bonus** logic in the new app, we
can either:
- Reuse these collections directly, or
- Migrate them into a more normalized promo model.

---

## Summary

- The **new app keeps MongoDB as the main DB**.
- Your critical MySQL tables are imported so that:
  - Users and wallet balances live in Mongo `users`
  - Money movements live in `transactions`
  - Legacy OTP/number data, referrals, and promos are preserved in
    1:1 mirrored collections (`active_number`, `tiger_number`, etc.).
- The migration is performed by `backend/migrations/mysql_to_mongo.py`,
  which you run **once** in your own environment when you are ready
  to move over your existing users.

If you want, we can extend this mapping later to:
- Automatically hydrate `sms_orders` from `active_number` / `tiger_number`
- Wire referrals and promocodes into the new UI and admin panel.
