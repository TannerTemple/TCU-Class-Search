"""Server-rendered page shell: search, filters, results, and the calendar (FR-01 to FR-23)."""

import pytest
from flask.testing import FlaskClient

from app import create_app


@pytest.fixture
def client() -> FlaskClient:
    return create_app({"TESTING": True}).test_client()


def test_page_has_a_search_box(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert 'id="search-input"' in html
    assert 'type="search"' in html


def test_page_has_a_filters_container(client: FlaskClient) -> None:
    """FR-02 to FR-09: the filter controls are built client-side from the loaded data (D-19)."""
    html = client.get("/").get_data(as_text=True)
    assert 'id="filters-body"' in html


def test_page_has_result_state_containers(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert 'id="results-list"' in html
    assert 'id="results-message"' in html


def test_page_exposes_a_short_status_date_for_js(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert 'data-status-as-of="Nov 8"' in html


def test_page_has_a_calendar_container(client: FlaskClient) -> None:
    """FR-16, FR-17, FR-20, FR-23: the calendar is built client-side (D-19). It renders
    the empty-schedule hint itself (FR-41) once the schedule is known to be empty."""
    html = client.get("/").get_data(as_text=True)
    assert 'id="calendar-body"' in html


def test_no_course_materials_or_dead_links(client: FlaskClient) -> None:
    """FR-13, BR-19: no Course Materials control, and the shell has no empty-href link."""
    html = client.get("/").get_data(as_text=True)
    assert "Course Materials" not in html
    assert 'href=""' not in html
    assert "href='#'" not in html
    assert 'href="#"' not in html


def test_mobile_tabs_point_at_real_panels(client: FlaskClient) -> None:
    """FR-34: Search and My schedule tabs, each controlling a panel on the page."""
    html = client.get("/").get_data(as_text=True)
    assert 'role="tablist"' in html
    for tab_id, panel_id in (("tab-search", "search-panel"), ("tab-schedule", "calendar")):
        assert f'id="{tab_id}"' in html
        assert f'aria-controls="{panel_id}"' in html
        assert f'id="{panel_id}"' in html


def test_schedule_badge_starts_hidden(client: FlaskClient) -> None:
    """FR-34, BR-18: the badge shows only once a class is scheduled."""
    html = client.get("/").get_data(as_text=True)
    assert 'id="schedule-badge" class="tab-badge" aria-hidden="true" hidden' in html


def test_page_has_a_toast_live_region(client: FlaskClient) -> None:
    """FR-34: the add toast is announced, so it is a live region that is always rendered."""
    html = client.get("/").get_data(as_text=True)
    assert '<div id="toast" class="toast" role="status" aria-live="polite"></div>' in html


def test_page_has_one_h1_and_a_skip_link(client: FlaskClient) -> None:
    """NFR-04: one page heading, and a skip link past the filters to the search box."""
    html = client.get("/").get_data(as_text=True)
    assert html.count("<h1") == 1
    assert 'class="skip-link" href="#search-input"' in html


def test_filters_toggle_controls_the_filters(client: FlaskClient) -> None:
    """NFR-03: on narrow screens the long filter list collapses behind a button."""
    html = client.get("/").get_data(as_text=True)
    assert 'id="filters-toggle"' in html
    assert 'aria-controls="filters-body"' in html
    assert 'aria-expanded="false"' in html
