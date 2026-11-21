"""Clear the sales database and leave an empty valid SQLite schema.

Usage:
  python scripts/clear_database.py

Set SALES_DB in backend/.env or the shell to target another database file.
"""

import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("SALES_DB", ROOT / "sales.db"))


def main():
    if DB_PATH.exists():
        DB_PATH.unlink()

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript((ROOT / "sql" / "01_schema.sql").read_text(encoding="utf-8"))
    conn.executescript((ROOT / "sql" / "02_view.sql").read_text(encoding="utf-8"))
    conn.close()

    print(f"Database cleared: {DB_PATH}")
    print("The customers and orders tables now exist but contain no rows.")


if __name__ == "__main__":
    main()
