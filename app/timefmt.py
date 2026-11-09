"""Time and day parsing and formatting (BR-06)."""

from __future__ import annotations

import re

from app.models import Day, Meeting

_DAY_NAMES: dict[str, Day] = {
    "M": "Mon",
    "T": "Tue",
    "W": "Wed",
    "R": "Thu",
    "F": "Fri",
    "S": "Sat",  # D-30
    "SA": "Sat",
    "SU": "Sun",
}
_DAY_CODES = re.compile(r"(?:SA|SU|[MTWRFS])+")
_DAY_CODE = re.compile(r"SA|SU|[MTWRFS]")
_TIME_RANGE = re.compile(r"(\d{1,2}):(\d{2})-\s*(\d{1,2}):(\d{2})")


def to_12_hour(time_24: str) -> str:
    """Convert "15:30" to "3:30 PM"."""
    hour, minute = time_24.split(":")
    period = "AM" if int(hour) < 12 else "PM"
    return f"{int(hour) % 12 or 12}:{minute} {period}"


def parse_days(day_codes: str) -> tuple[Day, ...]:
    """Convert "MWF", "TR", or "SA" to day names. Anything else, such as "TBA", returns ()."""
    if not _DAY_CODES.fullmatch(day_codes):
        return ()
    return tuple(_DAY_NAMES[code] for code in _DAY_CODE.findall(day_codes))


def parse_time_range(time_text: str) -> tuple[str, str] | None:
    """Convert "9:00-9:50" to ("09:00", "09:50"). "ARR", ":-:", and "" return None."""
    match = _TIME_RANGE.fullmatch(time_text)
    if match is None:
        return None
    return f"{int(match[1]):02d}:{match[2]}", f"{int(match[3]):02d}:{match[4]}"


def format_meeting(meeting: Meeting) -> str:
    """Format a meeting as "Mon, Wed, Fri · 9:00–9:50 AM"."""
    start = to_12_hour(meeting.start_time)
    end = to_12_hour(meeting.end_time)
    if start[-2:] == end[-2:]:
        start = start[:-3]
    return f"{', '.join(meeting.days)} · {start}–{end}"
