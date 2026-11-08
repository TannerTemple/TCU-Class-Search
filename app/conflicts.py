"""Reference implementation of the BR-08 conflict rule. Stub until FR-21 is built."""

from __future__ import annotations

from app.models import Section


def sections_conflict(first: Section, second: Section) -> bool:
    """True if the sections share a day, overlap in time, and overlap in date range.

    A missing end date counts as overlapping (BR-08).
    """
    # TODO FR-21
    raise NotImplementedError
