"""Server-rendered page shell for search and results (FR-01, FR-11, FR-41)."""

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


def test_page_has_result_state_containers(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert 'id="results-list"' in html
    assert 'id="results-message"' in html


def test_page_exposes_a_short_status_date_for_js(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert 'data-status-as-of="Nov 8"' in html


def test_empty_schedule_hint_shows(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert "Add a class from search to start your schedule." in html


def test_no_course_materials_or_dead_links(client: FlaskClient) -> None:
    """FR-13, BR-19: no Course Materials control, and the shell has no empty-href link."""
    html = client.get("/").get_data(as_text=True)
    assert "Course Materials" not in html
    assert 'href=""' not in html
    assert "href='#'" not in html
    assert 'href="#"' not in html
