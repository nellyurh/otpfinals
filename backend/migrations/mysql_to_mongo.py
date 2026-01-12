"""Migration script: MariaDB (jaysmsor_base) -> MongoDB

This is a **template** script to help you migrate data from your existing
PHP/MySQL platform into the new FastAPI + MongoDB app.

It focuses on the Phase 1 MUST-HAVE tables you listed:
- user_data
- user_wallet
- user_transaction
- active_number
- tiger_number
- refer_data / refer_history
- promocode / promocode_history

HOW TO USE (outside Emergent, in your own environment):

1) Install dependencies in the environment where you will run this script:

   pip install mysql-connector-python pymongo

2) Set the following environment variables (e.g. in a .env file or shell):

   # MySQL (MariaDB) connection for your existing DB
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DB=jaysmsor_base
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password

   # MongoDB connection for the NEW app
   MONGO_URL=mongodb+srv://...
   DB_NAME=sms_gateway   # or the same DB_NAME used by the FastAPI app

3) Run the script **once**:

   cd backend
   python -m migrations.mysql_to_mongo

The script is written to be **idempotent-friendly**:
- It builds a mapping from legacy user_data.id -> new users.id (UUID)
- If a user with the same email already exists in Mongo, it *reuses* that user
  instead of creating a duplicate.
- It then updates wallet balances and imports transactions and legacy tables.

NOTE: This script does NOT affect the running FastAPI app on Emergent.
You will usually run it in your own environment when you are ready to
cut over from the old platform.
"""

import os
import uuid
from datetime import datetime
from typing import Dict

import mysql.connector  # requires: mysql-connector-python
from pymongo import MongoClient  # pymongo is already a dependency of motor


# ---------- Helpers ----------


def get_mysql_connection():
    """Create a MySQL/MariaDB connection using env vars.

    Expects:
      - MYSQL_HOST
      - MYSQL_PORT
      - MYSQL_DB
      - MYSQL_USER
      - MYSQL_PASSWORD
    """
    host = os.environ.get("MYSQL_HOST", "localhost")
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    database = os.environ.get("MYSQL_DB", "jaysmsor_base")
    user = os.environ.get("MYSQL_USER", "root")
    password = os.environ.get("MYSQL_PASSWORD", "")

    conn = mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
    )
    return conn


def get_mongo_db():
    """Return a pymongo database handle using MONGO_URL + DB_NAME env vars."""
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise RuntimeError("MONGO_URL env var is required for migration")

    db_name = os.environ.get("DB_NAME", "sms_gateway")
    client = MongoClient(mongo_url)
    return client[db_name]


def parse_datetime(value):
    """Best-effort conversion of SQL datetime/strings to ISO 8601 strings."""
    if isinstance(value, datetime):
        return value.isoformat()
    if not value:
        return None
    text = str(value)
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S.%f"):
        try:
            return datetime.strptime(text, fmt).isoformat()
        except Exception:
            continue
    # Fallback to raw string
    return text


# ---------- Migration functions ----------


def migrate_users(mysql_conn, mongo_db) -> Dict[str, str]:
    """Migrate user_data -> Mongo `users` collection.

    Returns a mapping: legacy_user_id (str) -> new_user_id (str UUID)

    Mapping logic:
    - If a Mongo user with the same email already exists, we re-use that user
      and record legacy_user_id -> existing.id
    - Otherwise we create a new user document with:
        id: new UUID
        legacy_user_id: original SQL id
        email, full_name, username, phone, status, etc.
      Wallet balances are filled later from user_wallet.
    """
    print("[users] Migrating user_data -> users ...")

    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_data")

    id_map: Dict[str, str] = {}
    inserted_count = 0
    reused_count = 0

    for row in cursor.fetchall():
        legacy_id = str(row["id"])
        email = row.get("email")

        if not email:
            # Skip rows without an email (cannot login in new app)
            continue

        existing = mongo_db.users.find_one({"email": email}, {"_id": 0, "id": 1})
        if existing:
            new_id = existing.get("id")
            if not new_id:
                # If the existing doc doesn't have an `id` field for some reason,
                # use a new UUID and update it.
                new_id = str(uuid.uuid4())
                mongo_db.users.update_one({"email": email}, {"$set": {"id": new_id}})
            reused_count += 1
        else:
            new_id = str(uuid.uuid4())
            full_name = row.get("name") or row.get("username") or email.split("@")[0]
            user_doc = {
                "id": new_id,
                "legacy_user_id": legacy_id,
                "email": email,
                "full_name": full_name,
                "username": row.get("username"),
                "phone": row.get("phone_number") or "",
                # Wallet fields will be updated from user_wallet
                "ngn_balance": 0.0,
                "usd_balance": 0.0,
                # Admin flag based on `type` column if you used that
                "is_admin": str(row.get("type") or "").lower() == "admin",
                "email_verified": row.get("email_verified"),
                "status": row.get("status"),
                "image_url": row.get("image_url"),
            }

            created_at = parse_datetime(row.get("register_date"))
            if created_at:
                user_doc["created_at"] = created_at

            mongo_db.users.insert_one(user_doc)
            inserted_count += 1

        id_map[legacy_id] = new_id

    cursor.close()
    print(f"[users] Done. Inserted={inserted_count}, Reused(existing by email)={reused_count}")
    return id_map


def migrate_wallets(mysql_conn, mongo_db, id_map: Dict[str, str]):
    """Migrate user_wallet -> augment Mongo `users` with balances & counters.

    - Sets ngn_balance from `balance`
    - Adds informational fields `legacy_total_recharge`, `legacy_total_otp`
    """
    print("[wallet] Migrating user_wallet -> users.ngn_balance ...")

    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_wallet")

    updated = 0
    skipped = 0

    for row in cursor.fetchall():
        legacy_user_id = str(row.get("user_id"))
        new_id = id_map.get(legacy_user_id)
        if not new_id:
            skipped += 1
            continue

        try:
            balance = float(row.get("balance") or 0)
        except Exception:
            balance = 0.0

        try:
            total_recharge = float(row.get("total_recharge") or 0)
        except Exception:
            total_recharge = 0.0

        try:
            total_otp = int(row.get("total_otp") or 0)
        except Exception:
            total_otp = 0

        mongo_db.users.update_one(
            {"id": new_id},
            {
                "$set": {
                    "ngn_balance": balance,
                    "legacy_total_recharge": total_recharge,
                    "legacy_total_otp": total_otp,
                }
            },
        )
        updated += 1

    cursor.close()
    print(f"[wallet] Done. Updated={updated}, Skipped(no mapped user)={skipped}")


def migrate_transactions(mysql_conn, mongo_db, id_map: Dict[str, str]):
    """Migrate user_transaction -> Mongo `transactions` collection.

    We map:
      - id           -> metadata.legacy_transaction_id
      - user_id      -> mapped via id_map to new users.id
      - amount       -> amount (float)
      - date         -> created_at (ISO string)
      - type         -> type (string)
      - receipt      -> metadata.receipt
      - txn_id       -> reference
      - status       -> status

    Currency is assumed to be NGN for these legacy wallet movements.
    """
    print("[tx] Migrating user_transaction -> transactions ...")

    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_transaction")

    batch = []
    count = 0
    skipped = 0

    for row in cursor.fetchall():
        legacy_user_id = str(row.get("user_id"))
        new_id = id_map.get(legacy_user_id)
        if not new_id:
            skipped += 1
            continue

        try:
            amount = float(row.get("amount") or 0)
        except Exception:
            amount = 0.0

        created_at = parse_datetime(row.get("date"))

        doc = {
            "id": str(uuid.uuid4()),
            "user_id": new_id,
            "type": row.get("type") or "legacy",
            "amount": amount,
            "currency": "NGN",
            "status": row.get("status") or "completed",
            "reference": row.get("txn_id"),
            "metadata": {
                "receipt": row.get("receipt"),
                "legacy_transaction_id": row.get("id"),
                "source_table": "user_transaction",
            },
        }
        if created_at:
            doc["created_at"] = created_at

        batch.append(doc)
        count += 1

        if len(batch) >= 500:
            mongo_db.transactions.insert_many(batch)
            batch = []

    if batch:
        mongo_db.transactions.insert_many(batch)

    cursor.close()
    print(f"[tx] Done. Inserted={count}, Skipped(no mapped user)={skipped}")


def migrate_table_as_is(mysql_conn, mongo_db, table_name: str, collection_name: str, datetime_fields=None):
    """Generic helper to mirror an entire SQL table into a Mongo collection 1:1.

    - All columns are copied as-is into documents.
    - Optionally, fields listed in `datetime_fields` are converted to ISO strings.

    This is used for:
      - active_number        -> active_number
      - tiger_number         -> tiger_number
      - refer_data           -> refer_data
      - refer_history        -> refer_history
      - promocode            -> promocode
      - promocode_history    -> promocode_history

    These collections are not wired into the new app logic yet, but they
    preserve your historical data for future use.
    """
    print(f"[{table_name}] Mirroring SQL table -> Mongo collection '{collection_name}' ...")

    datetime_fields = set(datetime_fields or [])

    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM {table_name}")

    mongo_db[collection_name].delete_many({"_source_table": table_name})

    batch = []
    count = 0

    for row in cursor.fetchall():
        doc = dict(row)
        for field in datetime_fields:
            if field in doc:
                doc[field] = parse_datetime(doc[field])

        # Mark origin for safety
        doc["_source_table"] = table_name
        batch.append(doc)
        count += 1

        if len(batch) >= 500:
            mongo_db[collection_name].insert_many(batch)
            batch = []

    if batch:
        mongo_db[collection_name].insert_many(batch)

    cursor.close()
    print(f"[{table_name}] Done. Inserted documents={count}")


# ---------- Main entrypoint ----------


def run_migration():
    print("=== Starting legacy MySQL -> MongoDB migration ===")
    mysql_conn = get_mysql_connection()
    mongo_db = get_mongo_db()

    try:
        # 1) Users and wallet / balances
        id_map = migrate_users(mysql_conn, mongo_db)
        migrate_wallets(mysql_conn, mongo_db, id_map)

        # 2) Transactions
        migrate_transactions(mysql_conn, mongo_db, id_map)

        # 3) Mirror key legacy tables 1:1 into their own collections
        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="active_number",
            collection_name="active_number",
            datetime_fields=["buy_time"],
        )

        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="tiger_number",
            collection_name="tiger_number",
            datetime_fields=["created_at", "updated_at"],
        )

        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="refer_data",
            collection_name="refer_data",
        )

        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="refer_history",
            collection_name="refer_history",
        )

        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="promocode",
            collection_name="promocode",
            datetime_fields=["date"],
        )

        migrate_table_as_is(
            mysql_conn,
            mongo_db,
            table_name="promocode_history",
            collection_name="promocode_history",
        )

        print("=== Migration complete. Please review the data in MongoDB. ===")
    finally:
        mysql_conn.close()


if __name__ == "__main__":
    run_migration()
