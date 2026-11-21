"""Cross-checks every SQL metric against an independent pandas calculation.
Run from the project root:  python -m unittest discover -s tests -v
"""
import sys
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from app import db  # noqa: E402

customers = pd.read_excel(ROOT / "data" / "customers.xlsx")
orders = pd.read_excel(ROOT / "data" / "orders.xlsx")
merged = orders.merge(customers, on="Customer_ID", how="inner")


def expected(df):
    nc = df[df.Order_Status != "Cancelled"]
    return {
        "net_revenue": df.Net_Amount_INR.sum(),
        "total_orders": df.Order_ID.nunique(),
        "unique_customers": df.Customer_ID.nunique(),
        "non_cancelled_orders": nc.Order_ID.nunique(),
        "average_order_value": df.Net_Amount_INR.sum() / nc.Order_ID.nunique() if len(nc) else 0,
        "repeat_customers": int((nc.groupby("Customer_ID").Order_ID.nunique() >= 2).sum()),
    }


class MetricTests(unittest.TestCase):
    def check(self, df, **filters):
        got = db.get_dashboard(**filters)
        exp = expected(df)
        for key, value in exp.items():
            self.assertAlmostEqual(got["kpis"][key], value, places=6, msg=f"{key} {filters}")
        self.assertAlmostEqual(sum(m["revenue"] for m in got["monthly"]), exp["net_revenue"])
        for key, col in (("by_category", "Category"), ("by_segment", "Customer_Segment"),
                         ("by_city", "City")):
            want = df.groupby(col).Net_Amount_INR.sum().to_dict()
            self.assertEqual({r["label"]: r["revenue"] for r in got[key]}, want, f"{key} {filters}")
        want = df.groupby("Order_Status").Order_ID.nunique().to_dict()
        self.assertEqual({r["label"]: r["orders"] for r in got["by_status"]}, want)
        self.assertEqual(sum(r["orders"] for r in got["by_status"]), exp["total_orders"])

    def test_no_filters(self):
        self.check(merged)
        self.assertEqual(db.get_dashboard()["kpis"]["total_orders"], len(orders))

    def test_headline_numbers(self):
        k = db.get_dashboard()["kpis"]
        self.assertEqual(k["net_revenue"], 1159206)
        self.assertEqual((k["total_orders"], k["unique_customers"], k["non_cancelled_orders"]), (240, 59, 204))

    def test_category_filter(self):
        self.check(merged[merged.Category == "Electronics"], category="Electronics")

    def test_segment_and_city(self):
        df = merged[(merged.Customer_Segment == "Corporate") & (merged.City == "Pune")]
        self.check(df, segment="Corporate", city="Pune")

    def test_status_filter(self):
        self.check(merged[merged.Order_Status == "Returned"], status="Returned")
        self.assertEqual(db.get_dashboard(status="Cancelled")["kpis"]["net_revenue"], 0)

    def test_date_range(self):
        df = merged[(merged.Order_Date >= "2026-02-01") & (merged.Order_Date <= "2026-03-31")]
        self.check(df, date_from="2026-02-01", date_to="2026-03-31")

    def test_combined_filters(self):
        df = merged[(merged.Order_Date >= "2026-03-01") & (merged.Category == "Office")
                    & (merged.Customer_Segment == "Consumer")]
        self.check(df, date_from="2026-03-01", category="Office", segment="Consumer")

    def test_empty_result_is_safe(self):
        k = db.get_dashboard(date_from="2030-01-01")["kpis"]
        self.assertEqual((k["net_revenue"], k["total_orders"], k["average_order_value"]), (0, 0, 0))

    def test_bad_input(self):
        with self.assertRaises(ValueError):
            db.get_dashboard(date_from="not-a-date")
        with self.assertRaises(ValueError):
            db.get_dashboard(date_from="2026-05-01", date_to="2026-01-01")

    def test_sql_injection_is_inert(self):
        self.assertEqual(db.get_dashboard(city="x' OR '1'='1")["kpis"]["total_orders"], 0)


if __name__ == "__main__":
    unittest.main()
