"""Time and day parsing and formatting. Stubs until FR-11 and FR-39 are built."""

from __future__ import annotations

from app.models import Day, Meeting


def to_12_hour(time_24: str) -> str:
    """Convert "15:30" to "3:30 PM" (BR-06)."""
    # TODO FR-11
    raise NotImplementedError


def parse_days(day_codes: str) -> tuple[Day, ...]:
    """Convert "MWF", "TR", or "SA" to day names. "TBA" returns an empty tuple."""
    # TODO FR-39
    raise NotImplementedError


def parse_time_range(time_text: str) -> tuple[str, str] | None:
    """Convert "9:00-9:50" to ("09:00", "09:50"). "ARR", ":-:", and "" return None."""
    # TODO FR-39
    raise NotImplementedError


def format_meeting(meeting: Meeting) -> str:
    """Format a meeting as "Mon, Wed, Fri · 9:00–9:50 AM" (BR-06)."""
    # TODO FR-11
    raise NotImplementedError
