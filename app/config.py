"""App configuration, read from environment variables."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _path_from_env(name: str, default: str) -> Path:
    """Read a path setting. Relative paths are resolved from the repo root."""
    path = Path(os.environ.get(name, default))
    return path if path.is_absolute() else BASE_DIR / path


class Config:
    CLASSIFY_DATA_PATH = _path_from_env("CLASSIFY_DATA_PATH", "data/tcu_classes_spring27.json")
    CLASSIFY_META_PATH = _path_from_env("CLASSIFY_META_PATH", "data/term_meta.json")
    CLASSIFY_OVERRIDES_PATH = _path_from_env("CLASSIFY_OVERRIDES_PATH", "data/overrides.json")
    CLASSIFY_SHOWCASE_PATH = _path_from_env(
        "CLASSIFY_SHOWCASE_PATH", "data/instructors_showcase.json"
    )
