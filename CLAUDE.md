# Classify

A student-built, unofficial replacement for TCU's public class search that combines class search with a schedule builder on one page.

**Main use case:** a student searches classes in a clean, fast UI and adds them straight onto a weekly calendar, then registers in my.tcu.edu.

**It is:** class search, a self-built weekly schedule, conflict warnings, and a copy-numbers hand-off.

**It is not:** a schedule recommender, a registration system, or a degree audit. It doesn't use student records.

## Status

Built so far: data loading and cleanup (#5), the JSON API (#6), the results list with search and filters (#8, #9), the weekly calendar with add, remove, swap, hide, and BR-08 conflicts (#11, #12, #13), the class detail pop-up (#10), and the hand-off (copy, the my.tcu.edu link, and the timestamp and snapshot labels, which already existed) (#14). Mobile tabs and the accessibility pass (#15). A UI refactor: course cards with credit hours, a viewport-height layout with 25-course paging, an always-on 8 AM–6 PM calendar with hover previews and in-place section switching, and new day, start-time, and status filters (D-41 to D-46). Remaining work is tracked in GitHub issues under the `Spring 2027 MVP` milestone.

**Deployed:** https://classify.azurewebsites.net (#7, D-40). Redeploy steps are in `docs/08-deployment-azure.md`.

**Build order:** #7 (Azure deploy, done) → get feedback from about 10 students → #15 (mobile, accessibility). If most testers will use phones, do #15 before feedback.

**Data:** Build on the current Spring 2027 file. The Fall 2026 file is unused (D-16).

**Not yet:** Don't work on OQ-07, OQ-09, or OQ-24 until the team asks. The team is working with the data it has now.

**Finished setup instructions:** `docs/claude-prompt/first.md` was the one-time setup prompt. Don't follow it. The "For Claude Code" steps at the top of `docs/11-open-questions.md` have already been applied. `docs/10-decisions.md` is the record of what was decided.

## Workflow

1. Pick the next issue. Read its FR IDs in `docs/04-requirements.md`.
2. Branch from an up-to-date `main`: `feat/<issue-number>-<short-name>`.
3. Before opening a PR, run `ruff check .`, `ruff format --check .`, `pytest`, `python scripts/validate_data.py`, and, if `app/static/js/conflicts.js` changed, `node --test tests/js/*.test.mjs`. CI runs the same checks.
4. Open one PR per issue, with `Closes #<issue-number>` in the description.
5. The other teammate approves it, because GitHub doesn't allow approving your own PR.

## Commands

```sh
source .venv/bin/activate
pip install -r requirements-dev.txt
flask --app app run --debug      # run
pytest                           # test
ruff check .                     # lint
ruff format .                    # format
python scripts/validate_data.py  # check the data
node --test tests/js/*.test.mjs  # test the JS conflict rule (D-20); needs Node, nothing else
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

## Docs

Docs live in `docs/`. Update them when behavior changes. Reference IDs (BR, UC, FR, NFR, D, OQ). Record new decisions in `docs/10-decisions.md` and unknowns in `docs/11-open-questions.md`. Don't guess at unknowns.
