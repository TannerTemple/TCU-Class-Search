"""Server-rendered pages."""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, current_app, render_template

from app.timefmt import format_date, to_12_hour

pages_bp = Blueprint("pages", __name__)


def _format_status_date(value: datetime) -> str:
    """Short form for status chips, e.g. "Nov 8" (BR-05)."""
    return f"{value:%b} {value.day}"


TIME_STOP_RANGE = (6 * 60, 22 * 60)  # 6:00 AM to 10:00 PM covers every Spring start time.
TIME_STOP_MINUTES = 15


def time_stops() -> list[tuple[str, str]]:
    """The start-time slider's stops as ("HH:MM", "h:mm AM") pairs (FR-04).

    Built here so time formatting stays in Python (D-20).
    """
    first, last = TIME_STOP_RANGE
    stops = []
    for minutes in range(first, last + 1, TIME_STOP_MINUTES):
        time_24 = f"{minutes // 60:02d}:{minutes % 60:02d}"
        stops.append((time_24, to_12_hour(time_24)))
    return stops


@pages_bp.get("/")
def index() -> str:
    term = current_app.extensions["classify_store"].term
    return render_template(
        "index.html",
        term=term,
        data_as_of=format_date(term.scraped_at),
        status_as_of=_format_status_date(term.scraped_at),
        time_stops=time_stops(),
    )
