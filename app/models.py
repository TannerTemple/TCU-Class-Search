"""In-memory data model. See docs/06-data-dictionary.md."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Literal

Day = Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
Status = Literal["Open", "Closed"]


@dataclass(frozen=True, slots=True)
class Term:
    code: str  # e.g. "4273"
    name: str  # e.g. "Spring 2027"
    scraped_at: datetime
    source: str  # e.g. "classes.tcu.edu"


@dataclass(frozen=True, slots=True)
class Meeting:
    days: tuple[Day, ...]
    start_time: str  # 24-hour "HH:MM"
    end_time: str  # 24-hour "HH:MM"


@dataclass(frozen=True, slots=True)
class Section:
    class_nbr: str
    subject: str
    catalog_nbr: str
    course_code: str
    title: str
    section: str
    session_code: str
    session_name: str | None
    component_type: str
    component_label: str | None  # Provisional (D-25). None means show the raw code.
    core_codes: tuple[str, ...]
    start_date: date
    end_date: date | None  # Latest possible end. None means unknown (BR-08).
    instruction_mode: str
    status: Status  # Open or Closed. Permit sections count as Closed (D-17).
    status_detail: str  # Raw value, e.g. "DeptPermit".
    enroll_max: int | None
    rsv_max: int | None
    wait_max: int | None
    note: str | None  # Always None for now (D-27).
    course_description_url: str | None  # From syllabus_url (D-24).
    meetings: tuple[Meeting, ...] = field(default_factory=tuple)  # Empty means Unscheduled.
    meetings_may_be_incomplete: bool = False  # Listed in data/overrides.json (FR-43).
    instructor_name: str | None = None  # Showcase classes only (D-12).
    rmp_url: str | None = None  # Showcase classes only (D-12).
 
