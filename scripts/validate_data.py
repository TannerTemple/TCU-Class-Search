"""Check the term data before a deploy. Exits non-zero if the data is invalid."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import Config  # noqa: E402
from app.data_loader import (  # noqa: E402
    DataError,
    find_data_warnings,
    load_data_store,
    load_overrides,
)


def main() -> int:
    try:
        store = load_data_store(
            Config.CLASSIFY_DATA_PATH,
            Config.CLASSIFY_META_PATH,
            Config.CLASSIFY_OVERRIDES_PATH,
            Config.CLASSIFY_SHOWCASE_PATH,
        )
        overrides = load_overrides(Config.CLASSIFY_OVERRIDES_PATH)
    except DataError as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1

    print(f"OK: {Config.CLASSIFY_DATA_PATH}")
    print(f"Term: {store.term.name} ({store.term.code})")
    print(f"Records: {len(store.records)}")
    print(f"Sections: {len(store.sections)}")
    print(f"Scraped at: {store.term.scraped_at.isoformat()}")

    warnings = find_data_warnings(store.records, overrides.meetings)
    print(f"Warnings: {len(warnings)}")
    for warning in warnings:
        print(f"  {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
