import gzip
import json

import pytest
from flask.testing import FlaskClient

from app import create_app

ALL_SECTIONS = 3926


@pytest.fixture(scope="module")
def client() -> FlaskClient:
    return create_app({"TESTING": True}).test_client()


def sections(client: FlaskClient, query: str) -> list[dict]:
    response = client.get(f"/api/sections?{query}")
    assert response.status_code == 200
    body = response.get_json()
    assert body["count"] == len(body["sections"])
    return body["sections"]


def test_returns_every_section_with_no_params(client: FlaskClient) -> None:
    body = client.get("/api/sections").get_json()
    assert body["count"] == len(body["sections"]) == ALL_SECTIONS


def test_section_fields_are_ready_for_display(client: FlaskClient) -> None:
    section = client.get("/api/sections/34429").get_json()
    assert section["course_code"] == "ACCT 20353"
    assert section["start_date"] == "2027-01-19"
    assert section["start_date_display"] == "Jan 19, 2027"
    assert section["meetings"] == [
        {
            "days": ["Mon", "Wed", "Fri"],
            "start_time": "08:00",
            "end_time": "08:50",
            "text": "Mon, Wed, Fri · 8:00–8:50 AM",
        }
    ]


def test_empty_fields_are_left_out(client: FlaskClient) -> None:
    section = client.get("/api/sections/34429").get_json()
    assert not {"note", "rsv_max", "end_date", "instructor_name", "rmp_url"} & section.keys()


def test_showcase_section_includes_instructor(client: FlaskClient) -> None:
    section = client.get("/api/sections/31705").get_json()
    assert section["instructor_name"] == "Michael Scherger"
    assert section["rmp_url"] == "https://www.ratemyprofessors.com/professor/1749709"


@pytest.mark.parametrize("query", ["q=acct", "q=ACCT", "q=20353", "q=Fundamentals of accounting"])
def test_search_matches_any_case_and_field(client: FlaskClient, query: str) -> None:
    assert any(s["class_nbr"] == "34429" for s in sections(client, query))


def test_status_filter_counts_permits_as_closed(client: FlaskClient) -> None:
    assert len(sections(client, "status=Open")) == 2633
    assert len(sections(client, "status=Closed")) == 1293


def test_subject_filter(client: FlaskClient) -> None:
    matched = sections(client, "subject=acct")
    assert matched
    assert {s["subject"] for s in matched} == {"ACCT"}


def test_days_filter_includes_any_class_meeting_on_a_selected_day(client: FlaskClient) -> None:
    """FR-03: the default match lists Tue/Thu classes when only Tue is selected."""
    matched = sections(client, "days=Tue")
    day_sets = {tuple(m["days"]) for s in matched for m in s["meetings"]}
    assert ("Tue", "Thu") in day_sets
    assert ("Mon", "Wed", "Fri") not in day_sets
    assert all(any("Tue" in m["days"] for m in s["meetings"]) for s in matched)


def test_days_match_only_needs_every_meeting_day_selected(client: FlaskClient) -> None:
    matched = sections(client, "days=Mon,Wed,Fri&days_match=only")
    day_sets = {tuple(m["days"]) for s in matched for m in s["meetings"]}
    assert ("Mon", "Wed", "Fri") in day_sets
    assert ("Tue", "Thu") not in day_sets
    assert all(s["meetings"] for s in matched)


def test_days_filter_skips_unscheduled_sections(client: FlaskClient) -> None:
    assert all(s["meetings"] for s in sections(client, "days=Mon,Tue,Wed,Thu,Fri,Sat,Sun"))


def test_start_time_range_is_inclusive_and_skips_unscheduled(client: FlaskClient) -> None:
    matched = sections(client, "start_from=09:00&start_to=11:00")
    starts = {m["start_time"] for s in matched for m in s["meetings"]}
    assert min(starts) == "09:00"
    assert max(starts) == "11:00"
    assert all(s["meetings"] for s in matched)


def test_session_and_mode_filters(client: FlaskClient) -> None:
    assert {s["session_code"] for s in sections(client, "session=8W1")} == {"8W1"}
    online = sections(client, "mode=Online Only")
    assert {s["instruction_mode"] for s in online} == {"Online Only"}


@pytest.mark.parametrize(
    ("level", "count"), [("10000-29999", 1286), ("30000-49999", 1675), ("50000-plus", 965)]
)
def test_level_bands(client: FlaskClient, level: str, count: int) -> None:
    assert len(sections(client, f"level={level}")) == count


def test_core_filter_matches_any_selected_code(client: FlaskClient) -> None:
    matched = sections(client, "core=HUM,SSC")
    assert matched
    assert all({"HUM", "SSC"} & set(s["core_codes"]) for s in matched)


def test_core_match_all_needs_every_selected_code(client: FlaskClient) -> None:
    """FR-09: CA and GA together lists only sections carrying both codes."""
    matched = sections(client, "core=CA,GA&core_match=all")
    assert len(matched) == 6
    assert all({"CA", "GA"} <= set(s["core_codes"]) for s in matched)
    assert len(sections(client, "core=CA,GA")) > len(matched)


def test_filters_combine(client: FlaskClient) -> None:
    matched = sections(client, "subject=ACCT&status=Open&q=fundamentals")
    assert matched
    assert all(s["subject"] == "ACCT" and s["status"] == "Open" for s in matched)


def test_no_matches_is_an_empty_list(client: FlaskClient) -> None:
    assert sections(client, "q=zzzznotaclass") == []


@pytest.mark.parametrize(
    "query",
    [
        "level=x",
        "status=open",
        "subject=NOPE",
        "session=ZZZ",
        "mode=Teleport",
        "days=Monday",
        "days=Tue&days_match=all",
        "core=NOPE",
        "core=CA&core_match=both",
        "start_from=9am",
        "start_to=25:00",
        "start_from=12:00&start_to=09:00",
        f"q={'x' * 101}",
        "unknown=1",
    ],
)
def test_bad_params_return_400(client: FlaskClient, query: str) -> None:
    response = client.get(f"/api/sections?{query}")
    assert response.status_code == 400
    assert response.get_json()["error"] == "invalid_param"


def test_detail_status_codes(client: FlaskClient) -> None:
    assert client.get("/api/sections/34429").status_code == 200
    assert client.get("/api/sections/99999").status_code == 404
    assert client.get("/api/sections/123").status_code == 400
    assert client.get("/api/sections/abcde").status_code == 400


def test_full_list_is_gzipped_and_within_budget(client: FlaskClient) -> None:
    response = client.get("/api/sections", headers={"Accept-Encoding": "gzip"})
    assert response.headers["Content-Encoding"] == "gzip"
    assert "Accept-Encoding" in response.headers["Vary"]
    assert len(response.data) <= 150_000
    assert json.loads(gzip.decompress(response.data))["count"] == ALL_SECTIONS


def test_full_list_supports_conditional_requests(client: FlaskClient) -> None:
    first = client.get("/api/sections")
    etag = first.headers["ETag"]
    second = client.get("/api/sections", headers={"If-None-Match": etag})
    assert second.status_code == 304
    assert second.data == b""


def test_filtered_results_are_gzipped(client: FlaskClient) -> None:
    response = client.get("/api/sections?subject=ACCT", headers={"Accept-Encoding": "gzip"})
    assert response.headers["Content-Encoding"] == "gzip"
    assert json.loads(gzip.decompress(response.data))["count"] > 0


def test_static_assets_are_compressed_and_cached() -> None:
    client = create_app({"TESTING": True}).test_client()
    response = client.get("/static/css/app.css", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200
    assert response.headers["Content-Encoding"] == "gzip"
    assert "max-age=3600" in response.headers["Cache-Control"]
    assert b"--accent" in gzip.decompress(response.data)


@pytest.mark.parametrize("path", ["/", "/api/health", "/api/sections", "/api/sections/99999"])
def test_security_headers_on_every_response(client: FlaskClient, path: str) -> None:
    headers = client.get(path).headers
    assert "default-src 'self'" in headers["Content-Security-Policy"]
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
