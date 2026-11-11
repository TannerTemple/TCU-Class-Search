"""Versioned static URLs: a deploy changes every asset URL together (NFR-02)."""

import re
from pathlib import Path

from app import create_app
from app.static_version import compute_static_version


def test_page_loads_assets_from_a_versioned_path() -> None:
    app = create_app({"TESTING": True})
    html = app.test_client().get("/").get_data(as_text=True)
    version = app.config["STATIC_VERSION"]
    assert f'/assets/{version}/css/app.css"' in html
    assert f'/assets/{version}/js/app.js"' in html


def test_versioned_modules_resolve_relative_imports() -> None:
    """app.js imports ./calendar.js; under the versioned path that resolves to a
    versioned URL too, which must be served and cached."""
    client = create_app({"TESTING": True}).test_client()
    app_js = client.get("/assets/abc123/js/app.js").get_data(as_text=True)
    assert re.search(r'from "\./calendar\.js"', app_js)
    response = client.get("/assets/abc123/js/calendar.js")
    assert response.status_code == 200
    assert "max-age=3600" in response.headers["Cache-Control"]


def test_version_changes_when_any_static_file_changes(tmp_path: Path) -> None:
    (tmp_path / "js").mkdir()
    (tmp_path / "js" / "a.js").write_text("one")
    before = compute_static_version(tmp_path)
    assert compute_static_version(tmp_path) == before
    (tmp_path / "js" / "a.js").write_text("two")
    assert compute_static_version(tmp_path) != before


def test_unknown_versioned_file_is_404() -> None:
    client = create_app({"TESTING": True}).test_client()
    assert client.get("/assets/abc123/js/missing.js").status_code == 404
