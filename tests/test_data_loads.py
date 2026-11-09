from pathlib import Path

import pytest

from app import create_app
from app.config import Config
from app.data_loader import DataError, load_data_store, load_records, validate_records


def test_term_data_loads() -> None:
    assert len(load_records(Config.CLASSIFY_DATA_PATH)) > 0


def test_missing_data_file_fails_at_startup(tmp_path: Path) -> None:
    with pytest.raises(DataError, match="not found"):
        create_app({"CLASSIFY_DATA_PATH": tmp_path / "missing.json"})


def test_empty_data_is_rejected() -> None:
    with pytest.raises(DataError, match="non-empty"):
        validate_records([])


def test_mismatched_term_meta_is_rejected(tmp_path: Path) -> None:
    meta = tmp_path / "term_meta.json"
    meta.write_text(
        '{"term_code": "0000", "scraped_at": "2026-11-08T14:51:07-06:00", "source": "x"}'
    )
    with pytest.raises(DataError, match="does not match"):
        load_data_store(
            Config.CLASSIFY_DATA_PATH,
            meta,
            Config.CLASSIFY_OVERRIDES_PATH,
            Config.CLASSIFY_SHOWCASE_PATH,
        )
