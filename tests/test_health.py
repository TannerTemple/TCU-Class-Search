import pytest
from flask.testing import FlaskClient

from app import create_app


@pytest.fixture
def client() -> FlaskClient:
    return create_app({"TESTING": True}).test_client()


def test_health_returns_ok(client: FlaskClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_meta_returns_term_and_timestamp(client: FlaskClient) -> None:
    body = client.get("/api/meta").get_json()
    assert body["term_code"] == "4273"
    assert body["term_name"] == "Spring 2027"
    assert body["scraped_at"] == "2026-11-08T14:51:07-06:00"
    assert body["source"] == "classes.tcu.edu"
    assert body["record_count"] > 0


def test_index_shows_shell_content(client: FlaskClient) -> None:
    html = client.get("/").get_data(as_text=True)
    assert "Classify" in html
    assert "Spring 2027" in html
    assert "Nov 8, 2026" in html
    assert (
        "Unofficial student project. Not affiliated with or endorsed by "
        "Texas Christian University." in html
    )
