"""Compression, caching, and security headers (NFR-02, NFR-05)."""

from __future__ import annotations

import gzip
import hashlib
import json
from dataclasses import dataclass
from typing import Any

from flask import Response, request

_COMPRESSIBLE_TYPES = frozenset(
    {
        "application/javascript",
        "application/json",
        "text/css",
        "text/html",
        "text/javascript",
    }
)
_MIN_COMPRESS_BYTES = 500
_SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; base-uri 'self'; form-action 'self'; "
        "frame-ancestors 'none'; object-src 'none'"
    ),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


@dataclass(frozen=True, slots=True)
class CachedJson:
    """A JSON body built and compressed once, at startup."""

    raw: bytes
    gzipped: bytes
    etag: str


def build_cached_json(value: Any) -> CachedJson:
    raw = json.dumps(value, separators=(",", ":")).encode("utf-8")
    return CachedJson(
        raw=raw,
        gzipped=gzip.compress(raw, compresslevel=9),
        etag=hashlib.sha256(raw).hexdigest()[:32],
    )


def _accepts_gzip() -> bool:
    return request.accept_encodings.quality("gzip") > 0


def cached_json_response(payload: CachedJson) -> Response:
    """Serve a prebuilt body, so that heavy traffic costs almost no CPU."""
    use_gzip = _accepts_gzip()
    response = Response(payload.gzipped if use_gzip else payload.raw, mimetype="application/json")
    response.vary.add("Accept-Encoding")
    if use_gzip:
        response.headers["Content-Encoding"] = "gzip"
    response.set_etag(f"{payload.etag}-gzip" if use_gzip else payload.etag)
    response.headers["Cache-Control"] = "no-cache"
    return response.make_conditional(request)


def _compress(response: Response) -> None:
    if (
        response.status_code != 200
        or response.mimetype not in _COMPRESSIBLE_TYPES
        or "Content-Encoding" in response.headers
    ):
        return
    response.vary.add("Accept-Encoding")
    if not _accepts_gzip():
        return
    response.direct_passthrough = False
    body = response.get_data()
    if len(body) < _MIN_COMPRESS_BYTES:
        return
    response.set_data(gzip.compress(body))
    response.headers["Content-Encoding"] = "gzip"
    response.headers.pop("Accept-Ranges", None)


def finalize_response(response: Response) -> Response:
    _compress(response)
    response.headers.update(_SECURITY_HEADERS)
    return response
