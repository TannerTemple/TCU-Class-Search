"""Serialize sections and filter them for the API (FR-36, FR-37)."""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from app.models import Section
from app.timefmt import format_date, format_meeting

LEVEL_BANDS = {  # D-26
    "10000-29999": (10000, 29999),
    "30000-49999": (30000, 49999),
    "50000-plus": (50000, 99999),
}
CORE_CODES = frozenset(
    {
        "CSV",
        "CA",
        "FAR",
        "GA",
        "HUM",
        "HT",
        "LT",
        "MTH",
        "NSC",
        "OCO",
        "RT",
        "SSC",
        "WCO",
        "WEM",
    }
)
DAY_NAMES = frozenset({"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"})
DAYS_MATCH = frozenset({"any", "only"})  # FR-03
CORE_MATCH = frozenset({"any", "all"})  # FR-09
ALLOWED_PARAMS = frozenset(
    {
        "q",
        "subject",
        "days",
        "days_match",
        "start_from",
        "start_to",
        "status",
        "session",
        "mode",
        "level",
        "core",
        "core_match",
    }
)
MAX_QUERY_LENGTH = 100

_TIME = re.compile(r"(?:[01]\d|2[0-3]):[0-5]\d")


class FilterError(ValueError):
    """A query param is unknown or has a bad value."""

    def __init__(self, param: str, message: str) -> None:
        super().__init__(message)
        self.param = param


@dataclass(frozen=True, slots=True)
class Filters:
    terms: tuple[str, ...] = ()
    subject: str | None = None
    days: frozenset[str] | None = None
    days_match: str = "any"
    start_from: str | None = None
    start_to: str | None = None
    status: str | None = None
    session: str | None = None
    mode: str | None = None
    level: tuple[int, int] | None = None
    core: frozenset[str] | None = None
    core_match: str = "any"


def serialize_section(section: Section) -> dict[str, Any]:
    """Build a section's JSON form. Fields with no value are left out (BR-18)."""
    data: dict[str, Any] = {
        "class_nbr": section.class_nbr,
        "subject": section.subject,
        "catalog_nbr": section.catalog_nbr,
        "course_code": section.course_code,
        "title": section.title,
        "section": section.section,
        "session_code": section.session_code,
        "session_name": section.session_name,
        "component_type": section.component_type,
        "component_label": section.component_label,
        "core_codes": list(section.core_codes),
        "start_date": section.start_date.isoformat(),
        "start_date_display": format_date(section.start_date),  # FR-14: "Jan 19, 2027".
        "end_date": section.end_date.isoformat() if section.end_date else None,
        "instruction_mode": section.instruction_mode,
        "status": section.status,
        "status_detail": section.status_detail,
        "enroll_max": section.enroll_max,
        "rsv_max": section.rsv_max,
        "wait_max": section.wait_max,
        "course_description_url": section.course_description_url,
        "meetings": [
            {
                "days": list(meeting.days),
                "start_time": meeting.start_time,
                "end_time": meeting.end_time,
                "text": format_meeting(meeting),
            }
            for meeting in section.meetings
        ],
        "meetings_may_be_incomplete": section.meetings_may_be_incomplete or None,
        "instructor_name": section.instructor_name,
        "rmp_url": section.rmp_url,
    }
    return {key: value for key, value in data.items() if value is not None}


def _choice(name: str, value: str, allowed: Iterable[str]) -> str:
    if value not in allowed:
        raise FilterError(name, f"Unknown value for {name}: {value!r}")
    return value


def _choices(name: str, value: str, allowed: Iterable[str]) -> frozenset[str]:
    return frozenset(_choice(name, item.strip(), allowed) for item in value.split(","))


def _time(name: str, value: str) -> str:
    if not _TIME.fullmatch(value):
        raise FilterError(name, f"{name} must be 24-hour HH:MM.")
    return value


def parse_filters(args: Mapping[str, str], sections: Iterable[Section]) -> Filters:
    """Validate query params against the allowed values and the loaded data (NFR-05)."""
    unknown = sorted(set(args) - ALLOWED_PARAMS)
    if unknown:
        raise FilterError(unknown[0], f"Unknown param: {unknown[0]}")

    values = {name: args.get(name, "").strip() for name in ALLOWED_PARAMS}
    if len(values["q"]) > MAX_QUERY_LENGTH:
        raise FilterError("q", f"q can be at most {MAX_QUERY_LENGTH} characters.")

    sections = list(sections)
    start_from = _time("start_from", values["start_from"]) if values["start_from"] else None
    start_to = _time("start_to", values["start_to"]) if values["start_to"] else None
    if start_from and start_to and start_from > start_to:
        raise FilterError("start_from", "start_from must not be after start_to.")

    return Filters(
        terms=tuple(values["q"].lower().split()),
        subject=_choice("subject", values["subject"].upper(), {s.subject for s in sections})
        if values["subject"]
        else None,
        days=_choices("days", values["days"], DAY_NAMES) if values["days"] else None,
        days_match=_choice("days_match", values["days_match"], DAYS_MATCH)
        if values["days_match"]
        else "any",
        start_from=start_from,
        start_to=start_to,
        status=_choice("status", values["status"], {"Open", "Closed"})
        if values["status"]
        else None,
        session=_choice("session", values["session"].upper(), {s.session_code for s in sections})
        if values["session"]
        else None,
        mode=_choice("mode", values["mode"], {s.instruction_mode for s in sections})
        if values["mode"]
        else None,
        level=LEVEL_BANDS[_choice("level", values["level"], LEVEL_BANDS)]
        if values["level"]
        else None,
        core=_choices("core", values["core"].upper(), CORE_CODES) if values["core"] else None,
        core_match=_choice("core_match", values["core_match"], CORE_MATCH)
        if values["core_match"]
        else "any",
    )


def _matches_terms(section: Section, terms: tuple[str, ...]) -> bool:
    text = f"{section.course_code} {section.title}".lower()
    return all(term in text for term in terms)


def _matches_days(section: Section, days: frozenset[str], mode: str) -> bool:
    """FR-03: "any" meets on at least one selected day; "only" meets on no other day."""
    if not section.meetings:
        return False
    if mode == "only":
        return all(set(m.days) <= days for m in section.meetings)
    return any(days.intersection(m.days) for m in section.meetings)


def _matches_core(section: Section, core: frozenset[str], mode: str) -> bool:
    """FR-09: "any" has at least one selected code; "all" has every one."""
    if mode == "all":
        return core <= set(section.core_codes)
    return bool(core.intersection(section.core_codes))


def _matches_start(section: Section, start_from: str | None, start_to: str | None) -> bool:
    return any(
        (start_from is None or m.start_time >= start_from)
        and (start_to is None or m.start_time <= start_to)
        for m in section.meetings
    )


def _matches(section: Section, filters: Filters) -> bool:
    if filters.subject and section.subject != filters.subject:
        return False
    if filters.status and section.status != filters.status:
        return False
    if filters.session and section.session_code != filters.session:
        return False
    if filters.mode and section.instruction_mode != filters.mode:
        return False
    if filters.level and not filters.level[0] <= int(section.catalog_nbr) <= filters.level[1]:
        return False
    if filters.core and not _matches_core(section, filters.core, filters.core_match):
        return False
    if filters.days and not _matches_days(section, filters.days, filters.days_match):
        return False
    if (filters.start_from or filters.start_to) and not _matches_start(
        section, filters.start_from, filters.start_to
    ):
        return False
    return _matches_terms(section, filters.terms)


def filter_sections(sections: Iterable[Section], filters: Filters) -> list[Section]:
    return [section for section in sections if _matches(section, filters)]
