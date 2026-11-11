"""Classify application factory."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from flask import Flask

from app.config import Config
from app.data_loader import load_data_store
from app.responses import build_cached_json, finalize_response
from app.routes.api import api_bp
from app.routes.pages import pages_bp
from app.search import serialize_section
from app.static_version import init_static_version

_STATIC_MAX_AGE_SECONDS = 3600


def create_app(overrides: Mapping[str, Any] | None = None) -> Flask:
    """Build the app. Raises DataError at startup if the data is missing or invalid (NFR-07)."""
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = None if app.debug else _STATIC_MAX_AGE_SECONDS
    if overrides:
        app.config.update(overrides)

    store = load_data_store(
        app.config["CLASSIFY_DATA_PATH"],
        app.config["CLASSIFY_META_PATH"],
        app.config["CLASSIFY_OVERRIDES_PATH"],
        app.config["CLASSIFY_SHOWCASE_PATH"],
    )
    app.extensions["classify_store"] = store
    app.extensions["classify_sections_payload"] = build_cached_json(
        {
            "count": len(store.sections),
            "sections": [serialize_section(section) for section in store.sections],
        }
    )

    init_static_version(app)
    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)
    app.after_request(finalize_response)
    return app
