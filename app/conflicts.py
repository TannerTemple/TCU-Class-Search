"""Reference implementation of the BR-08 conflict rule.

The browser runs the live version in app/static/js/conflicts.js (NFR-06: schedules
never leave the browser). Both must pass tests/fixtures/conflict_cases.json (D-20).
"""

from __future__ import annotations

from datetime import date

from app.models import Meeting, Section

_FAR_FUTURE = date.max  # BR-08: an unknown end date counts as overlapping.


def _meetings_overlap(first: Meeting, second: Meeting) -> bool:
    if not set(first.days) & set(second.days):
        return False
    return first.start_time < second.end_time and second.start_time < first.end_time


def _date_ranges_overlap(first: Section, second: Section) -> bool:
    first_end = first.end_date or _FAR_FUTURE
    second_end = second.end_date or _FAR_FUTURE
    return first.start_date <= second_end and second.start_date <= first_end


def sections_conflict(first: Section, second: Section) -> bool:
    """True if the sections share a day, overlap in time, and overlap in date range.

    A missing end date counts as overlapping (BR-08). Touching times, where one
    meeting ends exactly when the other starts, don't overlap.
    """
    if not _date_ranges_overlap(first, second):
        return False
    return any(_meetings_overlap(a, b) for a in first.meetings for b in second.meetings)
