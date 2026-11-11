"""Versioned static URLs, so a deploy never mixes old and new assets.

The JavaScript modules import each other by relative path (`./calendar.js`).
Serving them under `/assets/<version>/...` makes every relative import carry
the same version, so after a deploy a browser can't pair a new `app.js` with a
cached old `calendar.js` and fail to load (NFR-02 caching stays on).
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from flask import Flask, Response, current_app, send_from_directory


def compute_static_version(static_folder: str | Path) -> str:
    """A short hash of every static file's path and contents."""
    root = Path(static_folder)
    digest = hashlib.sha256()
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()[:10]


def _versioned_static(version: str, filename: str) -> Response:
    # Any version is accepted, so a page loaded just before a deploy still gets files.
    return send_from_directory(current_app.static_folder or "", filename)


def init_static_version(app: Flask) -> None:
    version = compute_static_version(app.static_folder or "")
    app.config["STATIC_VERSION"] = version
    app.add_url_rule(
        "/assets/<version>/<path:filename>",
        endpoint="versioned_static",
        view_func=_versioned_static,
    )

    @app.context_processor
    def _inject_static_version() -> dict[str, str]:
        return {"static_version": version}
