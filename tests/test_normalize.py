from datetime import date

import pytest

from app.config import Config
from app.data_loader import (
    DataStore,
    Overrides,
    derive_session_end_dates,
    find_data_warnings,
    load_data_store,
    normalize_records,
)
from app.models import Meeting


@pytest.fixture(scope="module")
def store() -> DataStore:
    return load_data_store(
        Config.CLASSIFY_DATA_PATH,
        Config.CLASSIFY_META_PATH,
        Config.CLASSIFY_OVERRIDES_PATH,
        Config.CLASSIFY_SHOWCASE_PATH,
    )


def test_every_record_becomes_one_section(store: DataStore) -> None:
    assert len(store.sections) == len(store.records) == 3926
    assert len(store.sections_by_class_nbr) == 3926
    assert sum(len(group) for group in store.sections_by_subject.values()) == 3926


def test_scheduled_section_has_a_meeting(store: DataStore) -> None:
    section = store.sections_by_class_nbr["34429"]
    assert section.course_code == "ACCT 20353"
    assert section.meetings == (
        Meeting(days=("Mon", "Wed", "Fri"), start_time="08:00", end_time="08:50"),
    )
    assert section.start_date == date(2027, 1, 19)


def test_rows_without_set_times_have_no_meetings(store: DataStore) -> None:
    by_time = {
        record["time"]: store.sections_by_class_nbr[record["class_nbr"]]
        for record in store.records
        if record["time"] in {"ARR", ":-:"}
    }
    assert set(by_time) == {"ARR", ":-:"}
    assert all(section.meetings == () for section in by_time.values())


def test_meeting_override_corrects_the_bad_row(store: DataStore) -> None:
    assert store.sections_by_class_nbr["35782"].meetings == (
        Meeting(days=("Tue",), start_time="12:00", end_time="13:00"),
    )


def test_permit_sections_count_as_closed(store: DataStore) -> None:
    permits = [s for s in store.sections if s.status_detail in {"DeptPermit", "InstrPermit"}]
    assert len(permits) == 1293
    assert {s.status for s in permits} == {"Closed"}


def test_note_is_always_empty(store: DataStore) -> None:
    assert {section.note for section in store.sections} == {None}


def test_session_end_dates_keep_eight_week_halves_apart(store: DataStore) -> None:
    ends = derive_session_end_dates(store.records)
    assert ends == {"8W1": date(2027, 3, 21), "4W1": date(2027, 2, 14)}


def test_component_labels_stay_raw_when_unconfirmed(store: DataStore) -> None:
    labels = {s.component_type: s.component_label for s in store.sections}
    assert labels["LEC"] == "Lecture"
    assert labels["LCL"] is None
    assert labels["STA"] is None
    assert labels["PER"] is None


def test_incomplete_sections_are_flagged(store: DataStore) -> None:
    flagged = [s for s in store.sections if s.meetings_may_be_incomplete]
    assert len(flagged) == 13
    assert {s.subject for s in flagged} == {"MATH"}


def test_showcase_instructor_is_joined(store: DataStore) -> None:
    section = store.sections_by_class_nbr["31705"]
    assert section.instructor_name == "Michael Scherger"
    assert section.rmp_url == "https://www.ratemyprofessors.com/professor/1749709"
    assert store.sections_by_class_nbr["34429"].instructor_name is None


def test_rows_sharing_a_class_number_merge_meetings(store: DataStore) -> None:
    first = next(r for r in store.records if r["class_nbr"] == "35029")
    second = {**first, "days": "TR", "time": "13:00-13:50"}
    no_overrides = Overrides(meetings={}, incomplete=frozenset())
    sections = normalize_records([first, second, dict(first)], no_overrides, {})
    assert len(sections) == 1
    assert [m.days for m in sections[0].meetings] == [("Mon",), ("Tue", "Thu")]


def test_overridden_rows_are_not_reported_as_warnings(store: DataStore) -> None:
    assert len(find_data_warnings(store.records)) == 1
    assert find_data_warnings(store.records, overridden={"35782"}) == []
