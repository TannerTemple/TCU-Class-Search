"""Server-rendered pages."""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, current_app, render_template

pages_bp = Blueprint("pages", __name__)


def _format_data_date(value: datetime) -> str:
    return f"{value:%b} {value.day}, {value.year}"


def _format_status_date(value: datetime) -> str:
    """Short form for status chips, e.g. "Nov 8" (BR-05)."""
    return f"{value:%b} {value.day}"


@pages_bp.get("/")
def index() -> str:
    term = current_app.extensions["classify_store"].term
    return render_template(
        "index.html",
        term=term,
        data_as_of=_format_data_date(term.scraped_at),
        status_as_of=_format_status_date(term.scraped_at),
    )
