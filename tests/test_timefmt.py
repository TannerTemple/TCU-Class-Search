from datetime import date

import pytest

from app.models import Meeting
from app.timefmt import format_date, format_meeting, parse_days, parse_time_range, to_12_hour


@pytest.mark.parametrize(
    ("time_24", "expected"),
    [
        ("08:00", "8:00 AM"),
        ("00:30", "12:30 AM"),
        ("12:00", "12:00 PM"),
        ("15:30", "3:30 PM"),
    ],
)
def test_to_12_hour(time_24: str, expected: str) -> None:
    assert to_12_hour(time_24) == expected


@pytest.mark.parametrize(
    ("codes", "expected"),
    [
        ("MWF", ("Mon", "Wed", "Fri")),
        ("TR", ("Tue", "Thu")),
        ("TWRF", ("Tue", "Wed", "Thu", "Fri")),
        ("SA", ("Sat",)),
        ("S", ("Sat",)),
        ("SU", ("Sun",)),
        ("TBA", ()),
        ("12:00-13:00", ()),
        ("", ()),
    ],
)
def test_parse_days(codes: str, expected: tuple[str, ...]) -> None:
    assert parse_days(codes) == expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("9:00-9:50", ("09:00", "09:50")),
        ("13:00-14:50", ("13:00", "14:50")),
        ("ARR", None),
        (":-:", None),
        ("", None),
    ],
)
def test_parse_time_range(text: str, expected: tuple[str, str] | None) -> None:
    assert parse_time_range(text) == expected


@pytest.mark.parametrize(
    ("start", "end", "expected"),
    [
        ("09:00", "09:50", "Mon, Wed, Fri · 9:00–9:50 AM"),
        ("11:00", "12:20", "Mon, Wed, Fri · 11:00 AM–12:20 PM"),
        ("13:00", "14:50", "Mon, Wed, Fri · 1:00–2:50 PM"),
    ],
)
def test_format_meeting(start: str, end: str, expected: str) -> None:
    meeting = Meeting(days=("Mon", "Wed", "Fri"), start_time=start, end_time=end)
    assert format_meeting(meeting) == expected


def test_format_date() -> None:
    assert format_date(date(2027, 1, 19)) == "Jan 19, 2027"
