"""JSON API. See FR-35 to FR-38 in docs/04-requirements.md."""

from __future__ import annotations

from flask import Blueprint, Response, current_app, jsonify

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.get("/health")
def health() -> Response:
    return jsonify(status="ok")


@api_bp.get("/meta")
def meta() -> Response:
    store = current_app.extensions["classify_store"]
    return jsonify(
        term_code=store.term.code,
        term_name=store.term.name,
        scraped_at=store.term.scraped_at.isoformat(),
        source=store.term.source,
        record_count=len(store.records),
    )


@api_bp.get("/sections")
def sections() -> tuple[Response, int]:
    # TODO FR-36
    return jsonify(error="not_implemented", requirement="FR-36"), 501


@api_bp.get("/sections/<class_nbr>")
def section_detail(class_nbr: str) -> tuple[Response, int]:
    # TODO FR-37
    return jsonify(error="not_implemented", requirement="FR-37"), 501
