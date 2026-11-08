# Classify

A student-built, unofficial replacement for TCU's public class search that combines class search with a schedule builder on one page.

**Main use case:** a student searches classes in a clean, fast UI and adds them straight onto a weekly calendar, then registers in my.tcu.edu.

**It is:** class search, a self-built weekly schedule, conflict warnings, and a copy-numbers hand-off.

**It is not:** a schedule recommender, a registration system, or a degree audit. It doesn't use student records.

## Status

Docs and scaffold exist. Features are stubs marked with `TODO FR-xx`. The data file in use is Spring 2027; the Fall 2026 file is unused (D-16).

## Commands

```sh
source .venv/bin/activate
pip install -r requirements-dev.txt
flask --app app run --debug      # run
pytest                           # test
ruff check .                     # lint
ruff format .                    # format
python scripts/validate_data.py  # check the data
```

## Folder map

| Path | Contents |
|---|---|
| `app/` | Flask app: factory, loader, models, routes, templates, static |
| `data/` | Term JSON, `term_meta.json`, showcase instructors |
| `docs/` | Requirements and project docs |
| `scripts/` | Data validation |
| `tests/` | pytest tests |

## Hard rules

BR IDs in `docs/02-business-rules.md` are law. In particular:

- Never add registration, enrollment, or drop features (BR-01).
- Never scrape or use data behind the TCU login (BR-02).
- Never add personal data collection (BR-17). Schedules never leave the browser (NFR-06).
- Never invent instructor names or RMP links (D-12). Never add RMP ratings (BR-13).
- Hide empty fields: no empty labels, columns, or placeholders (BR-18).
- Show times in 12-hour format with day names (BR-06).
- Treat status as a snapshot, and always show the data timestamp (BR-04, BR-05).
- Permit sections count as Closed in the filter and chip (BR-21).
- Use no TCU logos or marks, and keep the footer disclaimer (BR-16).
- Don't edit the scraped class data files. They are replaced whole (see the runbook in `docs/06-data-dictionary.md`). Corrections go in `data/overrides.json`.
- Keep lectures and labs as separate sections, and never guess a pairing or a missing meeting (BR-11, D-33).

## Coding conventions

- Type hints everywhere. Small modules.
- Time, day, and conflict logic are small pure functions.
- Tests for every parser and for the conflict rule (BR-08).
- Time formatting lives only in Python; see D-20 for how the conflict rule stays consistent in the browser.
- When a stub is built, remove its `xfail`. They are strict, so the test fails until you do.

## Docs

Docs live in `docs/`. Update them when behavior changes. Reference IDs (BR, UC, FR, NFR, D, OQ). Record new decisions in `docs/10-decisions.md` and unknowns in `docs/11-open-questions.md`. Don't guess at unknowns.
