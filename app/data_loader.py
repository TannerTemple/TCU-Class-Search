"""Load and validate the term data. Normalization is a stub until FR-39 is built."""

from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from app.models import Section, Term

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

_TERM_NAME = re.compile(r"(\d{2}) (Spring|Summer|Fall|Winter)")
_TIME_RANGE = re.compile(r"\d{1,2}:\d{2}-\s*\d{1,2}:\d{2}")
_NO_SET_TIMES = {"ARR", ":-:"}

Record = dict[str, Any]


class DataError(RuntimeError):
    """The term data is missing or invalid. The app must not start (NFR-07)."""


@dataclass(slots=True)
class DataStore:
    term: Term
    records: list[Record]
    sections: list[Section] = field(default_factory=list)  # TODO FR-39: fill from normalize().
    sections_by_class_nbr: dict[str, Section] = field(default_factory=dict)  # TODO FR-39.


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


def load_data_store(data_path: Path, meta_path: Path) -> DataStore:
    records = load_records(data_path)
    return DataStore(term=load_term(meta_path, records), records=records)


def find_data_warnings(records: list[Record]) -> list[str]:
    """List rows the app can still load but that need a human look."""
    warnings: list[str] = []
    counts = Counter(record["class_nbr"] for record in records)
    warnings.extend(
        f"{class_nbr}: appears {count} times" for class_nbr, count in counts.items() if count > 1
    )
    for record in records:
        time_text = record["time"]
        if time_text in _NO_SET_TIMES or _TIME_RANGE.fullmatch(time_text):
            continue
        warnings.append(
            f"{record['class_nbr']} ({record['course']}): "
            f"unparseable days={record['days']!r} time={time_text!r}"
        )
    return warnings


def normalize(record: Record) -> Section:
    """Convert one raw record into a Section."""
    # TODO FR-39: apply the rules in docs/06-data-dictionary.md.
    raise NotImplementedError("normalize() is not built yet (FR-39).")
