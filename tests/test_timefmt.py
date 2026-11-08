"""Placeholders for FR-11 and FR-39. strict xfail makes these fail once the stubs are built."""

import pytest

from app.timefmt import parse_days, parse_time_range, to_12_hour

not_built = pytest.mark.xfail(raises=NotImplementedError, strict=True)


@not_built
@pytest.mark.parametrize(
    ("time_24", "expected"),
    [("08:00", "8:00 AM"), ("12:00", "12:00 PM"), ("15:30", "3:30 PM")],
)
def test_to_12_hour(time_24: str, expected: str) -> None:
    assert to_12_hour(time_24) == expected


@not_built
@pytest.mark.parametrize(
    ("codes", "expected"),
    [
        ("MWF", ("Mon", "Wed", "Fri")),
        ("TR", ("Tue", "Thu")),
        ("SA", ("Sat",)),
        ("S", ("Sat",)),
        ("TBA", ()),
    ],
)
def test_parse_days(codes: str, expected: tuple[str, ...]) -> None:
    assert parse_days(codes) == expected


@not_built
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
