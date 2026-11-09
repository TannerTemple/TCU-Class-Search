"""Load, validate, and normalize the term data. See docs/06-data-dictionary.md."""

from __future__ import annotations

import json
import re
from collections import Counter
from collections.abc import Container, Iterable, Mapping
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from app.models import Meeting, Section, Term
from app.timefmt import parse_days, parse_time_range

REQUIRED_KEYS = frozenset(
    {
        "term_code",
        "term_name",
        "class_nbr",
        "subject",
        "catalog_nbr",
        "course",
        "section",
        "session",
        "type",
        "core_codes",
        "note",
        "title",
        "start_date",
        "instruction_mode",
        "days",
        "time",
        "status",
        "enr_max",
        "rsv_max",
        "wait_max",
    }
)

SESSION_NAMES = {
    "REG": "Regular",
    "8W1": "1st Eight Week",
    "8W2": "2nd Eight Week",
    "4W1": "1st 4 Week",
    "4W2": "2nd 4 Week",
    "4W3": "3rd 4 Week",
    "4W4": "4th 4 Week",
    "3WK": "Three Week",
}

# Provisional (OQ-14). STA, LCL, and PER show the raw code for now (D-25).
COMPONENT_LABELS = {
    "LEC": "Lecture",
    "LAB": "Laboratory",
    "DIS": "Discussion",
    "SEM": "Seminar",
    "CLN": "Clinical",
    "PRA": "Practicum",
    "INT": "Internship",
    "RES": "Research",
    "DIR": "Directed Study",
    "ACT": "Activity",
    "STU": "Studio",
    "IND": "Independent Study",
    "WEB": "Web / Online",
    "EXP": "Experiential / Field Experience",
}

_TERM_NAME = re.compile(r"(\d{2}) (Spring|Summer|Fall|Winter)")
_TIME_RANGE = re.compile(r"\d{1,2}:\d{2}-\s*\d{1,2}:\d{2}")
_SESSION_FAMILY = re.compile(r"(\d)W(\d)")
_NO_SET_TIMES = {"ARR", ":-:"}

Record = dict[str, Any]


class DataError(RuntimeError):
    """The term data is missing or invalid. The app must not start (NFR-07)."""


@dataclass(frozen=True, slots=True)
class Overrides:
    meetings: Mapping[str, Record]  # class_nbr -> {"days": ..., "time": ...}
    incomplete: frozenset[str]


@dataclass(slots=True)
class DataStore:
    term: Term
    records: list[Record]
    sections: list[Section] = field(default_factory=list)
    sections_by_class_nbr: dict[str, Section] = field(default_factory=dict)
    sections_by_subject: dict[str, list[Section]] = field(default_factory=dict)


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise DataError(f"Data file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise DataError(f"Data file is not valid JSON: {path}: {exc}") from exc


def validate_records(records: Any) -> list[Record]:
    """Check that the data is a non-empty list of rows from one term, with all required keys."""
    if not isinstance(records, list) or not records:
        raise DataError("Class data must be a non-empty JSON list.")
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise DataError(f"Record {index} is not an object.")
        missing = REQUIRED_KEYS - record.keys()
        if missing:
            raise DataError(f"Record {index} is missing keys: {sorted(missing)}")
    term_codes = {record["term_code"] for record in records}
    if len(term_codes) != 1:
        raise DataError(f"Expected one term in the file, found: {sorted(term_codes)}")
    return records


def load_records(path: Path) -> list[Record]:
    return validate_records(_read_json(path))


def term_display_name(term_name: str) -> str:
    """Turn the raw term name, e.g. "27 Spring", into "Spring 2027"."""
    match = _TERM_NAME.fullmatch(term_name)
    if match is None:
        raise DataError(f"Unrecognized term name: {term_name!r}")
    return f"{match[2]} 20{match[1]}"


def load_term(meta_path: Path, records: list[Record]) -> Term:
    """Build the Term from the first record and the sidecar metadata file (D-18)."""
    meta = _read_json(meta_path)
    if not isinstance(meta, dict):
        raise DataError(f"Term metadata must be a JSON object: {meta_path}")
    code = records[0]["term_code"]
    if meta.get("term_code") != code:
        raise DataError(f"term_meta term_code {meta.get('term_code')!r} does not match {code!r}.")
    try:
        scraped_at = datetime.fromisoformat(meta["scraped_at"])
    except (KeyError, TypeError, ValueError) as exc:
        raise DataError(f"term_meta scraped_at is missing or invalid: {meta_path}") from exc
    if not meta.get("source"):
        raise DataError(f"term_meta source is missing: {meta_path}")
    return Term(
        code=code,
        name=term_display_name(records[0]["term_name"]),
        scraped_at=scraped_at,
        source=meta["source"],
    )


def load_overrides(path: Path) -> Overrides:
    raw = _read_json(path)
    try:
        return Overrides(
            meetings={
                row["class_nbr"]: {"days": row["days"], "time": row["time"]}
                for row in raw["meeting_overrides"]
            },
            incomplete=frozenset(raw["meetings_may_be_incomplete"]["class_nbrs"]),
        )
    except (KeyError, TypeError) as exc:
        raise DataError(f"Overrides file has the wrong shape: {path}") from exc


def load_showcase(path: Path) -> dict[str, Record]:
    raw = _read_json(path)
    try:
        return {
            row["class_nbr"]: {"name": row["instructor_name"], "rmp_url": row["rmp_url"]}
            for row in raw
        }
    except (KeyError, TypeError) as exc:
        raise DataError(f"Showcase file has the wrong shape: {path}") from exc


def load_data_store(
    data_path: Path, meta_path: Path, overrides_path: Path, showcase_path: Path
) -> DataStore:
    records = load_records(data_path)
    sections = normalize_records(
        records, load_overrides(overrides_path), load_showcase(showcase_path)
    )
    by_subject: dict[str, list[Section]] = {}
    for section in sections:
        by_subject.setdefault(section.subject, []).append(section)
    return DataStore(
        term=load_term(meta_path, records),
        records=records,
        sections=sections,
        sections_by_class_nbr={section.class_nbr: section for section in sections},
        sections_by_subject=by_subject,
    )


def find_data_warnings(records: list[Record], overridden: Container[str] = ()) -> list[str]:
    """List rows the app can still load but that need a human look."""
    warnings: list[str] = []
    counts = Counter(record["class_nbr"] for record in records)
    warnings.extend(
        f"{class_nbr}: appears {count} times" for class_nbr, count in counts.items() if count > 1
    )
    for record in records:
        time_text = record["time"]
        if (
            record["class_nbr"] in overridden
            or time_text in _NO_SET_TIMES
            or _TIME_RANGE.fullmatch(time_text)
        ):
            continue
        warnings.append(
            f"{record['class_nbr']} ({record['course']}): "
            f"unparseable days={record['days']!r} time={time_text!r}"
        )
    return warnings


def _parse_date(text: str) -> date:
    try:
        return datetime.strptime(text, "%m/%d/%y").date()
    except ValueError as exc:
        raise DataError(f"Invalid start_date: {text!r}") from exc


def derive_session_end_dates(records: Iterable[Record]) -> dict[str, date]:
    """Return each numbered session's latest possible end date (D-21).

    A session ends the day before the next session in its family starts. Sessions with no
    later sibling are left out, which means their end date is unknown.
    """
    starts: dict[str, date] = {}
    for record in records:
        start = _parse_date(record["start_date"])
        code = record["session"]
        starts[code] = min(start, starts.get(code, start))

    ends: dict[str, date] = {}
    for code in starts:
        match = _SESSION_FAMILY.fullmatch(code)
        if match is None:
            continue
        later = [
            start
            for other, start in starts.items()
            if (found := _SESSION_FAMILY.fullmatch(other))
            and found[1] == match[1]
            and int(found[2]) > int(match[2])
        ]
        if later:
            ends[code] = min(later) - timedelta(days=1)
    return ends


def _parse_meeting(record: Record) -> Meeting | None:
    days = parse_days(record["days"])
    times = parse_time_range(record["time"])
    if not days or times is None:
        return None
    return Meeting(days=days, start_time=times[0], end_time=times[1])


def normalize(
    rows: list[Record],
    session_end_dates: Mapping[str, date],
    incomplete: Container[str],
    showcase: Mapping[str, Record],
) -> Section:
    """Convert every row for one class number into a Section."""
    first = rows[0]
    class_nbr = first["class_nbr"]
    meetings = tuple(dict.fromkeys(m for row in rows if (m := _parse_meeting(row)) is not None))
    instructor = showcase.get(class_nbr, {})
    return Section(
        class_nbr=class_nbr,
        subject=first["subject"],
        catalog_nbr=first["catalog_nbr"],
        course_code=first["course"],
        title=first["title"],
        section=first["section"],
        session_code=first["session"],
        session_name=SESSION_NAMES.get(first["session"]),
        component_type=first["type"],
        component_label=COMPONENT_LABELS.get(first["type"]),
        core_codes=tuple(first["core_codes"]),
        start_date=_parse_date(first["start_date"]),
        end_date=session_end_dates.get(first["session"]),
        instruction_mode=first["instruction_mode"],
        status="Open" if first["status"] == "Open" else "Closed",  # BR-21
        status_detail=first["status"],
        enroll_max=first["enr_max"],
        rsv_max=first["rsv_max"],
        wait_max=first["wait_max"],
        note=None,  # D-27
        course_description_url=first.get("syllabus_url") or None,  # D-24
        meetings=meetings,
        meetings_may_be_incomplete=class_nbr in incomplete,
        instructor_name=instructor.get("name"),
        rmp_url=instructor.get("rmp_url") or None,
    )


def normalize_records(
    records: list[Record], overrides: Overrides, showcase: Mapping[str, Record]
) -> list[Section]:
    """Normalize all records, merging rows that share a class number (D-33)."""
    session_end_dates = derive_session_end_dates(records)
    grouped: dict[str, list[Record]] = {}
    for record in records:
        fixed = {**record, **overrides.meetings.get(record["class_nbr"], {})}
        grouped.setdefault(record["class_nbr"], []).append(fixed)
    return [
        normalize(rows, session_end_dates, overrides.incomplete, showcase)
        for rows in grouped.values()
    ]
