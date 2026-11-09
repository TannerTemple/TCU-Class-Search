"""JSON API. See FR-35 to FR-38 in docs/04-requirements.md."""

from __future__ import annotations

import re

from flask import Blueprint, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue

from app.responses import cached_json_response
from app.search import FilterError, filter_sections, parse_filters, serialize_section

api_bp = Blueprint("api", __name__, url_prefix="/api")

_CLASS_NBR = re.compile(r"\d{5}")


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
def sections() -> ResponseReturnValue:
    if not request.args:
        return cached_json_response(current_app.extensions["classify_sections_payload"])

    store = current_app.extensions["classify_store"]
    try:
        filters = parse_filters(request.args, store.sections)
    except FilterError as exc:
        return jsonify(error="invalid_param", param=exc.param, message=str(exc)), 400
    matched = filter_sections(store.sections, filters)
    return jsonify(count=len(matched), sections=[serialize_section(s) for s in matched])


@api_bp.get("/sections/<class_nbr>")
def section_detail(class_nbr: str) -> ResponseReturnValue:
    if not _CLASS_NBR.fullmatch(class_nbr):
        return jsonify(error="invalid_class_nbr"), 400
    section = current_app.extensions["classify_store"].sections_by_class_nbr.get(class_nbr)
    if section is None:
        return jsonify(error="not_found"), 404
    return jsonify(serialize_section(section))
