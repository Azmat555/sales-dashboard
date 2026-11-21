from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from app import db

app = FastAPI(title="Sales Dashboard API")


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


@app.get("/")
def startingMark():
    return {"Welcome to Sales Dashboard api running......"}
