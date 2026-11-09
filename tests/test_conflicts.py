"""BR-08 conflict rule, verified against the shared fixture used by the JS version (D-20)."""

import json
from datetime import date
from pathlib import Path

import pytest

from app.conflicts import sections_conflict
from app.models import Meeting, Section

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "conflict_cases.json"
CASES = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


def _section(data: dict) -> Section:
    meetings = tuple(
        Meeting(days=tuple(m["days"]), start_time=m["start_time"], end_time=m["end_time"])
        for m in data["meetings"]
    )
    return Section(
        class_nbr="00000",
        subject="TEST",
        catalog_nbr="10000",
        course_code="TEST 10000",
        title="Test Section",
        section="001",
        session_code="REG",
        session_name=None,
        component_type="LEC",
        component_label="Lecture",
        core_codes=(),
        start_date=date.fromisoformat(data["start_date"]),
        end_date=date.fromisoformat(data["end_date"]) if data["end_date"] else None,
        instruction_mode="In Person",
        status="Open",
        status_detail="Open",
        enroll_max=None,
        rsv_max=None,
        wait_max=None,
        note=None,
        course_description_url=None,
        meetings=meetings,
    )


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_conflict_cases(case: dict) -> None:
    first = _section(case["a"])
    second = _section(case["b"])
    assert sections_conflict(first, second) is case["conflict"]
    assert sections_conflict(second, first) is case["conflict"]  # Symmetric.
