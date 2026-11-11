# Decisions log

D-01 to D-14 came from the Nov 8, 2026 kickoff. D-15 to D-18 are team answers given after the data was reviewed. D-19 to D-23 were proposed during repo setup and approved by the team. D-24 onward record the open-questions review.

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
| D-19 | 2026-11-08 | Search and filter run in the browser on one JSON payload fetched at page load | Approved. See [architecture](05-architecture.md#search-and-filter-location) |
| D-20 | 2026-11-08 | Time formatting runs only in Python. The conflict rule runs in the browser, with a Python reference version, and both must pass one shared set of test cases | Approved. Schedules can't leave the browser (NFR-06). See [architecture](05-architecture.md#one-source-of-truth-for-shared-logic) |
| D-21 | 2026-11-08 | `end_date` is the day before the next session in the same family starts, derived from the data. Otherwise it is null | Confirmed by OQ-02. Makes 8W1 and 8W2 not clash without an outside calendar. See BR-08 |
| D-22 | 2026-11-08 | Result rows show instruction mode only when it isn't In Person | Approved. 96.4% of Spring rows are In Person |
| D-23 | 2026-11-08 | Don't display `enrolled`, `reserved`, `waitlisted`, or `bookstore_url` | Revised: D-24 now covers `syllabus_url` and D-25 covers `type`. Spring `enrolled` and `waitlisted` are always 0. `bookstore_url` is the Course Materials link (BR-19) |
| D-24 | 2026-11-08 | Show `syllabus_url` in the pop-up as "Course description (TCU) ↗". Never call it a syllabus | OQ-18. A sample link opened a catalog-style course description |
| D-25 | 2026-11-08 | Show component types using the provisional labels in OQ-14, with the raw code available. `STA`, `LCL`, and `PER` show the raw code for now | The data contradicts or doesn't support those three labels. Revisit after the main site is built |
| D-26 | 2026-11-08 | The course level filter uses three bands: 10000–29999, 30000–49999, and 50000 and up | OQ-17 |
| D-27 | 2026-11-08 | Always treat `note` as empty and never display it | OQ-11 |
| D-28 | 2026-11-08 | No stale data warning in the MVP. FR-31 moves to Later. The "Class data as of …" timestamp stays | OQ-20 |
| D-29 | 2026-11-08 | Correct class 35782 through `data/overrides.json`: Tuesdays, 12:00–1:00 PM | OQ-16. The scraped JSON stays untouched |
| D-30 | 2026-11-08 | `S` and `SA` both mean Saturday. `SU` means Sunday | OQ-15 |
| D-31 | 2026-11-08 | The hand-off copies one class number at a time, from each scheduled class. There is no bulk copy until a TCU database is available | OQ-19. Replaces the "Copy class numbers" button |
| D-32 | 2026-11-08 | Lectures and labs stay separate sections, linked only by a hint showing the labs a course lists | OQ-10. The data has no pairing, and each needs its own class number. See BR-11 and the [data dictionary](06-data-dictionary.md#lectures-and-labs) |
| D-33 | 2026-11-08 | The loader merges rows sharing a class number into one section with several meetings. The next scrape must write one row per meeting. Until then, 13 math sections carry an "incomplete times" note | OQ-10, OQ-24. See the [data dictionary](06-data-dictionary.md#multiple-meeting-patterns) |
| D-34 | 2026-11-08 | Showcase professors are hand-entered in `data/instructors_showcase.json`. `rmp_url` stays empty until the team pastes a verified link | OQ-04 |
| D-35 | 2026-11-08 | The MVP target is about 10 students using the site. Feedback is gathered by hand, with no feedback link in the app | OQ-05 |
| D-36 | 2026-11-08 | Use the cheapest App Service tier that runs the app within the Azure for Students credit. Start on Free if it works | OQ-08 |
| D-37 | 2026-11-08 | No open-source license for now. The README states all rights reserved | OQ-07 stays open |
| D-38 | 2026-11-08 | After launch, work with TCU on `classify.tcu.edu`, or on Classify taking over `classes.tcu.edu` | OQ-06. The Azure default URL is used until then |
| D-39 | 2026-11-08 | Anonymous analytics are not in the MVP | OQ-09 stays open for later |
| D-40 | 2026-11-11 | Host at `classify.azurewebsites.net`: app `classify` in resource group `classify-rg`, on a Free (F1) Linux plan in East US 2, running Python 3.12 | The subscription allows only five US and Canada regions, and only `eastus2` had F1 quota. The name has no "TCU" in it, so the site doesn't look official (BR-16). See [deployment](08-deployment-azure.md) |
