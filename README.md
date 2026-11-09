# Classify

Search every TCU class in a clean, fast UI and add classes straight onto your weekly schedule, with no jumping between Class Search, the Purple Schedule Builder, and Rate My Professor.

> Unofficial student project. Not affiliated with or endorsed by Texas Christian University.

## Why it exists

- Days and times are hard to read, so students cross-check their own calendars.
- You can't add a class to a schedule from the search.
- Reloading the page wipes everything.
- Clicking a class opens a new page.
- Empty fields, dead links, and a useless Course Materials button clutter a blocky layout.
- Students juggle extra tabs for the Purple Schedule Builder and Rate My Professor.

## MVP features

> The repo currently holds the docs and a runnable scaffold. These features are specified but not built yet.

- Instant search and filters for all Spring 2027 classes, including Core curriculum codes
- Clean result rows with 12-hour times and day names, and no empty fields
- A course detail pop-up with the class number and a copy button
- Add to a weekly calendar straight from search, with conflict warnings
- Remove, swap, and show or hide sections
- Autosave in the browser, with no account
- A copy button for each scheduled class number, plus a link to my.tcu.edu
- Rate My Professor links for a few showcase classes
- Works on phones

**What it does not do:** it doesn't register or enroll you, and it doesn't recommend schedules. You build your schedule and register in my.tcu.edu.

## Screenshot

_Placeholder: add a screenshot once the UI is built._

## Tech stack

Flask, Jinja, plain JavaScript and CSS, class data in JSON, and Azure App Service.

## Quick start

```sh
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app app run --debug
```

Open http://127.0.0.1:5000. `requirements-dev.txt` includes `requirements.txt` plus the test and lint tools.

Run the tests and lint:

```sh
pytest
ruff check .
```

## Project structure

```text
app/
  __init__.py           create_app()
  config.py             Environment settings
  data_loader.py        Load, validate, and normalize data
  models.py             Term, Section, Meeting
  timefmt.py            Time and day handling
  search.py             Section JSON and filters
  responses.py          Compression, caching, security headers
  conflicts.py          Conflict rule (stub)
  routes/               Page and API routes
  templates/            Jinja templates
  static/               CSS and JavaScript
data/
  tcu_classes_spring27.json   Spring 2027 data (in use)
  tcu_classes_fall26.json     Fall 2026 data (not in use)
  term_meta.json              Scrape time and source
  instructors_showcase.json   Hand-entered showcase instructors
  overrides.json              Hand-entered data corrections
docs/                   Project documentation
scripts/
  validate_data.py      Data check to run before deploying
tests/                  pytest tests
.github/workflows/      Deploy workflow (disabled)
```

## Updating class data

Follow the [data refresh runbook](docs/06-data-dictionary.md#data-refresh-runbook).

## Deploying

See [Deployment: Azure App Service](docs/08-deployment-azure.md).

## Docs

| Doc | Contents |
|---|---|
| [01 Vision and scope](docs/01-vision-and-scope.md) | Goals, users, and scope |
| [02 Business rules](docs/02-business-rules.md) | BR-xx |
| [03 Use cases](docs/03-use-cases.md) | UC-xx |
| [04 Requirements](docs/04-requirements.md) | FR-xx, NFR-xx, and traceability |
| [05 Architecture](docs/05-architecture.md) | Design and risks |
| [06 Data dictionary](docs/06-data-dictionary.md) | Fields, model, parsing, and runbook |
| [07 UI spec](docs/07-ui-spec.md) | Layout, states, and comparison with the current site |
| [08 Deployment](docs/08-deployment-azure.md) | Azure setup |
| [09 Roadmap](docs/09-roadmap.md) | What comes next |
| [10 Decisions](docs/10-decisions.md) | D-xx |
| [11 Open questions](docs/11-open-questions.md) | OQ-xx |
| [Kickoff notes](docs/meeting-notes/2026-11-08-kickoff.md) | Nov 8, 2026 meeting |
| [Project brief](docs/claude-prompt/first.md) | The prompt that set up this repo |

## Roadmap and contributing

Next: a Fall term toggle, anonymous usage counts, user testing, and talking to the TCU Registrar and IT. The full list is in the [roadmap](docs/09-roadmap.md).

To contribute, read the [business rules](docs/02-business-rules.md) first. Make sure `pytest` and `ruff check .` pass, and update the docs when behavior changes.

## Team

Elliott Miles and Tanner Temple

## License

Copyright 2026 Elliott Miles and Tanner Temple. All rights reserved. License TBD ([OQ-07](docs/11-open-questions.md)).
