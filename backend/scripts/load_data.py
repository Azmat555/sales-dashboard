"""Create the database schema and load customers.xlsx + orders.xlsx into it.

Usage:  python scripts/load_data.py [customers.xlsx] [orders.xlsx]
Safe to re-run: it rebuilds the tables from scratch each time.
"""
import os
import sqlite3
import sys
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("SALES_DB", ROOT / "sales.db"))

CUSTOMER_COLS = ["Customer_ID", "Customer_Name", "Email", "City", "State",
                 "Customer_Segment", "Join_Date", "Acquisition_Channel"]
ORDER_COLS = ["Order_ID", "Customer_ID", "Order_Date", "Product_ID", "Product_Name",
              "Category", "Quantity", "Unit_Price_INR", "Discount_Rate",
              "Net_Amount_INR", "Payment_Method", "Order_Status"]


def to_iso(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return date.fromisoformat(str(value).strip()[:10]).isoformat()


def read_sheet(path, expected_cols):
    wb = load_workbook(path, read_only=True, data_only=True)
    rows = wb.active.iter_rows(values_only=True)
    header = [str(h).strip() if h is not None else "" for h in next(rows)]
    if header != expected_cols:
        raise SystemExit(f"{path}: unexpected columns.\n  found:    {header}\n  expected: {expected_cols}")
    data = [r for r in rows if any(v is not None for v in r)]
    wb.close()
    return data


def clean(row, cols):
    out = []
    for col, v in zip(cols, row):
        if col in ("Join_Date", "Order_Date"):
            v = to_iso(v)
        elif col == "Quantity":
            v = int(v)
        elif col in ("Unit_Price_INR", "Net_Amount_INR"):
            v = float(v)
            v = int(v) if v == int(v) else v
        elif col == "Discount_Rate":
            v = float(v)
        else:
            v = str(v).strip()
        out.append(v)
    return out


def main():
    cust_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "customers.xlsx"
    ord_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / "orders.xlsx"

    customers = [clean(r, CUSTOMER_COLS) for r in read_sheet(cust_path, CUSTOMER_COLS)]
    orders = [clean(r, ORDER_COLS) for r in read_sheet(ord_path, ORDER_COLS)]

    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript((ROOT / "sql" / "01_schema.sql").read_text(encoding="utf-8"))
    conn.executescript((ROOT / "sql" / "02_view.sql").read_text(encoding="utf-8"))
    conn.execute("PRAGMA foreign_keys = ON")

    with conn:  # one transaction: all-or-nothing
        conn.executemany(f"INSERT INTO customers VALUES ({','.join('?' * len(CUSTOMER_COLS))})", customers)
        conn.executemany(f"INSERT INTO orders VALUES ({','.join('?' * len(ORDER_COLS))})", orders)

    # ---- reconciliation checks -------------------------------------------------
    n_c = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    n_o = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    n_v = conn.execute("SELECT COUNT(*) FROM vw_sales").fetchone()[0]
    rev_db = conn.execute("SELECT SUM(Net_Amount_INR) FROM orders").fetchone()[0]
    rev_xl = sum(r[ORDER_COLS.index("Net_Amount_INR")] for r in orders)
    fk_errors = conn.execute("PRAGMA foreign_key_check").fetchall()
    assert n_c == len(customers) and n_o == len(orders), "row count mismatch"
    assert n_v == n_o, "join dropped or duplicated rows"
    assert rev_db == rev_xl, "revenue mismatch between Excel and database"
    assert not fk_errors, f"foreign key violations: {fk_errors}"
    conn.close()

    print(f"Database created: {DB_PATH}")
    print(f"  customers loaded : {n_c}")
    print(f"  orders loaded    : {n_o}")
    print(f"  vw_sales rows    : {n_v}  (matches orders)")
    print(f"  total net revenue: INR {rev_db:,.0f}  (matches Excel)")
    print("  foreign keys     : OK")


if __name__ == "__main__":
    main()
