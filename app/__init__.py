"""Classify application factory."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from flask import Flask

from app.config import Config
from app.data_loader import load_data_store
from app.routes.api import api_bp
from app.routes.pages import pages_bp


def create_app(overrides: Mapping[str, Any] | None = None) -> Flask:
    """Build the app. Raises DataError at startup if the data is missing or invalid (NFR-07)."""
    app = Flask(__name__)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)

    app.extensions["classify_store"] = load_data_store(
        app.config["CLASSIFY_DATA_PATH"],
        app.config["CLASSIFY_META_PATH"],
    )

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)

    # TODO NFR-02: gzip responses and set static cache headers.
    # TODO NFR-05: add CSP, X-Content-Type-Options, and Referrer-Policy headers.
    return app
