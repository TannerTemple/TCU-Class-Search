# Decisions log

D-01 to D-14 came from the Nov 8, 2026 kickoff. D-15 to D-18 are team answers given after the data was reviewed. D-19 to D-23 are proposed during repo setup and need team review.

| ID | Date | Decision | Notes |
|---|---|---|---|
| D-01 | 2026-11-08 | Build a better TCU class search (chosen over an intramurals product) | Intramurals is parked |
| D-02 | 2026-11-08 | Students first; contact the Registrar and IT after launch | Usage is the pitch |
| D-03 | 2026-11-08 | Stack: one Python **Flask** app. Jinja templates with plain JavaScript and CSS; a JSON API from Flask | Team wants Python; Flask over Django for speed |
| D-04 | 2026-11-08 | No database in the MVP. Load the scraped JSON into memory at startup | Data is small and read-only; SQLite or Postgres later if needed |
| D-05 | 2026-11-08 | No login or accounts in the MVP. Schedules autosave in the browser (localStorage) | No cross-device sync in MVP |
| D-06 | 2026-11-08 | Host on **Azure App Service** (Linux, Python) using Azure for Students | $100 credit, 12 months, no credit card, renews each year while a student |
| D-07 | 2026-11-08 | Data: the scraped JSON for **Spring 2027** is committed to the repo; the scraper stays outside the repo | Scraped by subject, A to Z. See OQ-21 |
| D-08 | 2026-11-08 | Data refresh: once per term, until TCU provides an official feed | Seats/status are a snapshot |
| D-09 | 2026-11-08 | ~~Core curriculum codes are not in the MVP; the scraped data doesn't include them~~ | **Superseded by D-15.** The data does include them |
| D-10 | 2026-11-08 | Hide the class number from result rows; keep the course code as the main ID. The class number appears in the pop-up and in the copy hand-off | my.tcu.edu enrolls by class number |
| D-11 | 2026-11-08 | Rate My Professor: a link-out only in the MVP | Pulling ratings likely breaks RMP's terms |
| D-12 | 2026-11-08 | Instructor names require a TCU login on classes.tcu.edu, so the MVP has no instructor data in general. The team hand-enters instructors and RMP links for a **few showcase classes** in a separate file | Demo only; the full instructor list needs TCU's OK |
| D-13 | 2026-11-08 | Instructor photos: later, from the TCU staff directory | Not MVP |
| D-14 | 2026-11-08 | Product name: Classify (working) | Domain TBD. Use the Azure default URL until TCU IT approves a tcu.edu subdomain (OQ-06); `tcu.com` is not ours |
| D-15 | 2026-11-08 | Core curriculum codes are **in the MVP**: shown on sections and filterable | Supersedes D-09. `core_codes` is filled on 1,084 of 3,926 Spring rows. See BR-20, UC-10 |
| D-16 | 2026-11-08 | The MVP loads Spring 2027 only. `data/tcu_classes_fall26.json` stays in the repo, unused | Sample data for the roadmap's Fall term toggle |
| D-17 | 2026-11-08 | The status filter and chip have two values, Open and Closed. `DeptPermit` and `InstrPermit` count as Closed | 1,293 of 3,926 Spring rows are permit sections. The pop-up shows the permit detail. See BR-21 |
| D-18 | 2026-11-08 | `scraped_at` lives in a new sidecar file, `data/term_meta.json`, set to the data's commit time: 2026-11-08T14:51:07-06:00 | The JSON has no timestamp and must not be edited. The real scrape was at or before this time (OQ-12) |
| D-19 | 2026-11-08 | Search and filter run in the browser on one JSON payload fetched at page load | Proposed. See [architecture](05-architecture.md#search-and-filter-location) |
| D-20 | 2026-11-08 | Time formatting runs only in Python. The conflict rule runs in the browser, with a Python reference version, and both must pass one shared set of test cases | Proposed. Schedules can't leave the browser (NFR-06). See [architecture](05-architecture.md#one-source-of-truth-for-shared-logic) |
| D-21 | 2026-11-08 | `end_date` is the day before the next session in the same family starts, derived from the data. Otherwise it is null | Proposed. Makes 8W1 and 8W2 not clash without an outside calendar. See BR-08 |
| D-22 | 2026-11-08 | Result rows show instruction mode only when it isn't In Person | Proposed. 96.4% of Spring rows are In Person |
| D-23 | 2026-11-08 | Don't display `enrolled`, `reserved`, `waitlisted`, `syllabus_url`, or `bookstore_url`. Show `type` as the raw code | Proposed. Spring `enrolled` and `waitlisted` are always 0. `bookstore_url` is the Course Materials link (BR-19). See OQ-14, OQ-18 |
