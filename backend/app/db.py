"""Query layer: all dashboard metrics are computed in SQL against the vw_sales view."""
import os
import sqlite3
from datetime import date
from pathlib import Path

DB_PATH = Path(os.environ.get("SALES_DB", Path(__file__).resolve().parent.parent / "sales.db"))
STATUS_ORDER = ["Completed", "Returned", "Cancelled"]


def connect():
    if not DB_PATH.exists():
        raise RuntimeError(f"Database not found at {DB_PATH}. Run: python scripts/load_data.py")
    conn = sqlite3.connect(f"{DB_PATH.as_uri()}?mode=ro", uri=True)  # read-only
    conn.row_factory = sqlite3.Row
    return conn


def _check_date(value, name):
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        raise ValueError(f"{name} must be a date in YYYY-MM-DD format")


def build_where(date_from=None, date_to=None, category=None, segment=None, city=None, status=None):
    """Return (WHERE clause, params). Values are always bound parameters (no SQL injection)."""
    clauses, params = [], []
    if date_from:
        clauses.append("Order_Date >= ?"); params.append(_check_date(date_from, "date_from"))
    if date_to:
        clauses.append("Order_Date <= ?"); params.append(_check_date(date_to, "date_to"))
    if date_from and date_to and params[0] > params[1]:
        raise ValueError("date_from must be on or before date_to")
    for column, value in (("Category", category), ("Customer_Segment", segment),
                          ("City", city), ("Order_Status", status)):
        if value:
            clauses.append(f"{column} = ?"); params.append(value)
    return (("WHERE " + " AND ".join(clauses)) if clauses else ""), params


def get_filter_options():
    with connect() as conn:
        distinct = lambda col: [r[0] for r in conn.execute(
            f"SELECT DISTINCT {col} FROM vw_sales ORDER BY {col}")]
        lo, hi = conn.execute("SELECT MIN(Order_Date), MAX(Order_Date) FROM vw_sales").fetchone()
        return {"categories": distinct("Category"), "segments": distinct("Customer_Segment"),
                "cities": distinct("City"), "statuses": STATUS_ORDER,
                "min_date": lo, "max_date": hi}


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
    not_cancelled = (where + " AND " if where else "WHERE ") + "Order_Status <> 'Cancelled'"

    with connect() as conn:
        q = lambda sql, p=params: [dict(r) for r in conn.execute(sql, p)]

        k = dict(conn.execute(f"""
            SELECT COALESCE(SUM(Net_Amount_INR), 0)                                  AS net_revenue,
                   COUNT(DISTINCT Order_ID)                                          AS total_orders,
                   COUNT(DISTINCT Customer_ID)                                       AS unique_customers,
                   COUNT(DISTINCT CASE WHEN Order_Status <> 'Cancelled' THEN Order_ID END) AS non_cancelled_orders,
                   COUNT(DISTINCT CASE WHEN Order_Status = 'Returned'  THEN Order_ID END) AS returned_orders,
                   COALESCE(SUM(CASE WHEN Order_Status = 'Returned' THEN Net_Amount_INR END), 0) AS returned_revenue
            FROM vw_sales {where}""", params).fetchone())
        k["average_order_value"] = (k["net_revenue"] / k["non_cancelled_orders"]
                                    if k["non_cancelled_orders"] else 0)

        rc = conn.execute(f"""
            SELECT COUNT(*) AS buyers,
                   COALESCE(SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END), 0) AS repeat_customers
            FROM (SELECT Customer_ID, COUNT(DISTINCT Order_ID) AS n
                  FROM vw_sales {not_cancelled} GROUP BY Customer_ID)""", params).fetchone()
        k["repeat_customers"] = rc["repeat_customers"]
        k["repeat_rate"] = rc["repeat_customers"] / rc["buyers"] if rc["buyers"] else 0

        def group(col):
            return q(f"""SELECT {col} AS label, SUM(Net_Amount_INR) AS revenue,
                                COUNT(DISTINCT Order_ID) AS orders
                         FROM vw_sales {where} GROUP BY {col} ORDER BY revenue DESC, label""")

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

    return {"kpis": k, "monthly": monthly, "by_category": group("Category"),
            "by_segment": group("Customer_Segment"), "by_city": group("City"),
            "by_status": by_status, "top_products": top_products}
