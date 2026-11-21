"""Query layer: all dashboard metrics are computed in SQL against the vw_sales view."""

import os
import sqlite3
from datetime import date
from pathlib import Path

DB_PATH = Path(
    os.environ.get("SALES_DB", Path(__file__).resolve().parent.parent / "sales.db")
)
STATUS_ORDER = ["Completed", "Returned", "Cancelled"]


def connect():
    if not DB_PATH.exists():
        raise RuntimeError(
            f"Database not found at {DB_PATH}. Run: python scripts/load_data.py"
        )
    conn = sqlite3.connect(f"{DB_PATH.as_uri()}?mode=ro", uri=True)  # read-only
    conn.row_factory = sqlite3.Row
    return conn


def _check_date(value, name):
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        raise ValueError(f"{name} must be a date in YYYY-MM-DD format")


def build_where(
    date_from=None, date_to=None, category=None, segment=None, city=None, status=None
):
    """Return (WHERE clause, params). Values are always bound parameters (no SQL injection)."""
    clauses, params = [], []
    if date_from:
        clauses.append("Order_Date >= ?")
        params.append(_check_date(date_from, "date_from"))
    if date_to:
        clauses.append("Order_Date <= ?")
        params.append(_check_date(date_to, "date_to"))
    if date_from and date_to and params[0] > params[1]:
        raise ValueError("date_from must be on or before date_to")
    for column, value in (
        ("Category", category),
        ("Customer_Segment", segment),
        ("City", city),
        ("Order_Status", status),
    ):
        if value:
            clauses.append(f"{column} = ?")
            params.append(value)
    return (("WHERE " + " AND ".join(clauses)) if clauses else ""), params


def get_filter_options():
    with connect() as conn:
        distinct = lambda col: [
            r[0]
            for r in conn.execute(f"SELECT DISTINCT {col} FROM vw_sales ORDER BY {col}")
        ]
        lo, hi = conn.execute(
            "SELECT MIN(Order_Date), MAX(Order_Date) FROM vw_sales"
        ).fetchone()
        return {
            "categories": distinct("Category"),
            "segments": distinct("Customer_Segment"),
            "cities": distinct("City"),
            "statuses": STATUS_ORDER,
            "min_date": lo,
            "max_date": hi,
        }


def _fill_months(rows):
    """Insert zero-revenue rows for months with no orders so the trend line is continuous."""
    if not rows:
        return rows
    have = {r["month"]: r for r in rows}
    y, m = map(int, rows[0]["month"].split("-"))
    ey, em = map(int, rows[-1]["month"].split("-"))
    out = []
    while (y, m) <= (ey, em):
        key = f"{y:04d}-{m:02d}"
        out.append(have.get(key, {"month": key, "revenue": 0, "orders": 0}))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def get_dashboard(**filters):
    where, params = build_where(**filters)
    not_cancelled = (
        where + " AND " if where else "WHERE "
    ) + "Order_Status <> 'Cancelled'"

    with connect() as conn:
        q = lambda sql, p=params: [dict(r) for r in conn.execute(sql, p)]

        k = dict(
            conn.execute(
                f"""
            SELECT COALESCE(SUM(Net_Amount_INR), 0)                                  AS net_revenue,
                   COUNT(DISTINCT Order_ID)                                          AS total_orders,
                   COUNT(DISTINCT Customer_ID)                                       AS unique_customers,
                   COUNT(DISTINCT CASE WHEN Order_Status <> 'Cancelled' THEN Order_ID END) AS non_cancelled_orders,
                   COUNT(DISTINCT CASE WHEN Order_Status = 'Returned'  THEN Order_ID END) AS returned_orders,
                   COALESCE(SUM(CASE WHEN Order_Status = 'Returned' THEN Net_Amount_INR END), 0) AS returned_revenue
            FROM vw_sales {where}""",
                params,
            ).fetchone()
        )
        k["average_order_value"] = (
            k["net_revenue"] / k["non_cancelled_orders"]
            if k["non_cancelled_orders"]
            else 0
        )

        rc = conn.execute(
            f"""
            SELECT COUNT(*) AS buyers,
                   COALESCE(SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END), 0) AS repeat_customers
            FROM (SELECT Customer_ID, COUNT(DISTINCT Order_ID) AS n
                  FROM vw_sales {not_cancelled} GROUP BY Customer_ID)""",
            params,
        ).fetchone()
        k["repeat_customers"] = rc["repeat_customers"]
        k["repeat_rate"] = rc["repeat_customers"] / rc["buyers"] if rc["buyers"] else 0

        def group(col):
            return q(
                f"""SELECT {col} AS label, SUM(Net_Amount_INR) AS revenue,
                                COUNT(DISTINCT Order_ID) AS orders
                         FROM vw_sales {where} GROUP BY {col} ORDER BY revenue DESC, label"""
            )

        monthly = _fill_months(q(f"""
            SELECT Order_Month AS month, SUM(Net_Amount_INR) AS revenue,
                   COUNT(DISTINCT Order_ID) AS orders
            FROM vw_sales {where} GROUP BY Order_Month ORDER BY Order_Month"""))

        status_rows = {r["label"]: r for r in q(f"""
            SELECT Order_Status AS label, COUNT(DISTINCT Order_ID) AS orders,
                   SUM(Net_Amount_INR) AS revenue
            FROM vw_sales {where} GROUP BY Order_Status""")}
        by_status = [status_rows[s] for s in STATUS_ORDER if s in status_rows]

        top_products = q(f"""
            SELECT Product_Name AS label, SUM(Net_Amount_INR) AS revenue,
                   COUNT(DISTINCT Order_ID) AS orders
            FROM vw_sales {where} GROUP BY Product_ID, Product_Name
            ORDER BY revenue DESC, label LIMIT 5""")

    return {
        "kpis": k,
        "monthly": monthly,
        "by_category": group("Category"),
        "by_segment": group("Customer_Segment"),
        "by_city": group("City"),
        "by_status": by_status,
        "top_products": top_products,
    }


def get_customers(search=None):
    """Return every customer with order totals and lifetime spend."""
    clauses, params = [], []
    if search:
        clauses.append(
            "("
            + " OR ".join(
                [
                    "c.Customer_ID LIKE ?",
                    "c.Customer_Name LIKE ?",
                    "c.Email LIKE ?",
                    "c.City LIKE ?",
                    "c.State LIKE ?",
                    "c.Customer_Segment LIKE ?",
                ]
            )
            + ")"
        )
        term = f"%{search}%"
        params.extend([term] * 6)
    where = "WHERE " + " AND ".join(clauses) if clauses else ""

    with connect() as conn:
        rows = conn.execute(
            f"""
            SELECT c.*,
                   COUNT(o.Order_ID) AS order_count,
                   COALESCE(SUM(o.Net_Amount_INR), 0) AS lifetime_value,
                   MAX(o.Order_Date) AS last_order_date
            FROM customers c
            LEFT JOIN orders o ON o.Customer_ID = c.Customer_ID
            {where}
            GROUP BY c.Customer_ID
            ORDER BY c.Customer_Name COLLATE NOCASE
        """,
            params,
        ).fetchall()
    return [dict(row) for row in rows]


def get_customer(customer_id):
    """Return full customer information plus order history and summary."""
    with connect() as conn:
        customer = conn.execute(
            "SELECT * FROM customers WHERE Customer_ID = ?", (customer_id,)
        ).fetchone()
        if customer is None:
            return None

        orders = conn.execute(
            """
            SELECT o.*, c.Customer_Name, c.Email, c.City, c.State,
                   c.Customer_Segment
            FROM orders o
            JOIN customers c ON c.Customer_ID = o.Customer_ID
            WHERE o.Customer_ID = ?
            ORDER BY o.Order_Date DESC, o.Order_ID DESC
        """,
            (customer_id,),
        ).fetchall()

        summary = conn.execute(
            """
            SELECT COUNT(*) AS order_count,
                   COALESCE(SUM(Net_Amount_INR), 0) AS lifetime_value,
                   COALESCE(SUM(CASE WHEN Order_Status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_orders,
                   COALESCE(SUM(CASE WHEN Order_Status = 'Returned' THEN 1 ELSE 0 END), 0) AS returned_orders,
                   COALESCE(SUM(CASE WHEN Order_Status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_orders,
                   MAX(Order_Date) AS last_order_date
            FROM orders WHERE Customer_ID = ?
        """,
            (customer_id,),
        ).fetchone()

    return {
        "customer": dict(customer),
        "summary": dict(summary),
        "orders": [dict(row) for row in orders],
    }


def get_orders(search=None, status=None, limit=500):
    """Return recent orders for the admin order management page."""
    clauses, params = [], []
    if status:
        clauses.append("o.Order_Status = ?")
        params.append(status)
    if search:
        clauses.append(
            "("
            + " OR ".join(
                [
                    "o.Order_ID LIKE ?",
                    "o.Customer_ID LIKE ?",
                    "c.Customer_Name LIKE ?",
                    "o.Product_ID LIKE ?",
                    "o.Product_Name LIKE ?",
                    "o.Payment_Method LIKE ?",
                ]
            )
            + ")"
        )
        term = f"%{search}%"
        params.extend([term] * 6)
    where = "WHERE " + " AND ".join(clauses) if clauses else ""

    with connect() as conn:
        rows = conn.execute(
            f"""
            SELECT o.*, c.Customer_Name, c.Email, c.City, c.State,
                   c.Customer_Segment
            FROM orders o
            JOIN customers c ON c.Customer_ID = o.Customer_ID
            {where}
            ORDER BY o.Order_Date DESC, o.Order_ID DESC
            LIMIT ?
        """,
            (*params, max(1, min(int(limit), 5000))),
        ).fetchall()
    return [dict(row) for row in rows]


def update_order_status(order_id, status):
    """Update an order status while preserving database business constraints."""
    if status not in ("Completed", "Returned", "Cancelled"):
        raise ValueError("status must be Completed, Returned, or Cancelled")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        existing = conn.execute(
            "SELECT Order_ID FROM orders WHERE Order_ID = ?", (order_id,)
        ).fetchone()
        if existing is None:
            return None
        if status == "Cancelled":
            conn.execute(
                "UPDATE orders SET Order_Status = ?, Net_Amount_INR = 0 WHERE Order_ID = ?",
                (status, order_id),
            )
        else:
            conn.execute(
                """
                UPDATE orders
                SET Order_Status = ?,
                    Net_Amount_INR = CASE
                        WHEN Net_Amount_INR = 0 THEN ROUND(Quantity * Unit_Price_INR * (1 - Discount_Rate), 2)
                        ELSE Net_Amount_INR
                    END
                WHERE Order_ID = ?
            """,
                (status, order_id),
            )
        conn.commit()
        row = conn.execute(
            """
            SELECT o.*, c.Customer_Name, c.Email, c.City, c.State,
                   c.Customer_Segment
            FROM orders o
            JOIN customers c ON c.Customer_ID = o.Customer_ID
            WHERE o.Order_ID = ?
        """,
            (order_id,),
        ).fetchone()
        return dict(row)
    finally:
        conn.close()
