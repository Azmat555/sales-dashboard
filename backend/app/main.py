from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app import db

app = FastAPI(title="Sales Dashboard API")


class OrderStatusUpdate(BaseModel):
    status: str


@app.get("/api/filters")
def filters():
    """Distinct values used to populate the filter controls."""
    return db.get_filter_options()


@app.get("/api/dashboard")
def dashboard(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category: Optional[str] = None,
    segment: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
):
    """All KPIs and chart data for the current filter selection."""
    try:
        return db.get_dashboard(
            date_from=date_from,
            date_to=date_to,
            category=category,
            segment=segment,
            city=city,
            status=status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/customers")
def customers(search: Optional[str] = None):
    """Complete customer list with lifetime order summary."""
    return db.get_customers(search=search)


@app.get("/api/customers/{customer_id}")
def customer_detail(customer_id: str):
    """Full customer information and complete order history."""
    result = db.get_customer(customer_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result


@app.get("/api/orders")
def orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 500,
):
    """All or filtered recent orders for admin management."""
    if status and status not in ("Completed", "Returned", "Cancelled"):
        raise HTTPException(status_code=400, detail="Invalid order status")
    return db.get_orders(search=search, status=status, limit=limit)


@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdate):
    """Manage an order status."""
    try:
        result = db.update_order_status(order_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if result is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


@app.get("/")
def startingMark():
    return {"Welcome to Sales Dashboard API running......"}
