# MASTER PROMPT — Classify: requirements docs, README, and project scaffold

You are setting up the repository for **Classify**, a student-built, cleaner replacement for TCU's public class search (classes.tcu.edu) that combines class search with a schedule builder in one page. Your job in this session is to create the project's **documentation set, README, CLAUDE.md, and a minimal runnable Flask scaffold**. You are **not** implementing the product features yet.

Everything below is the source of truth, decided by the team on Nov 8, 2026. Do not invent facts, numbers, field names, or decisions that are not here or in the repo. Where something is unknown, write it as `TBD` and add it to `docs/11-open-questions.md`.

---

## 0. How to work (read first)

1. **Explore before writing.** List the repo tree. Find the scraped class data. It is one or more JSON files already committed to the repo; the scraper program itself is NOT in the repo. Open the JSON, and report the following:
   - each file's path and size
   - the record count
   - every field name, with 3 example values per field
   - which fields are often empty
2. **Stop and ask me** before writing docs if any of these is true:
   - you can't find the JSON
   - the JSON's fields don't match the fields listed in section 5
   - the data covers a term other than Spring 2027
   - anything in this prompt contradicts the repo
   
   Otherwise, continue without waiting.
3. **Don't move, rename, or edit the existing data files.** Reference them where they are, or tell me if they should move to `data/`.
4. **Screenshots.** If the team has placed screenshots of classes.tcu.edu in the repo (e.g., `docs/assets/`), look at them and use them in the UI spec and data dictionary. If none exist, note that in open questions.
5. **Don't commit or push.** Leave everything as uncommitted changes for review. At the end, print a summary of every file you created.
6. **Writing style for all docs:** plain English, short sentences, tables for anything compared side by side, numbered IDs (BR-xx, UC-xx, FR-xx, NFR-xx, D-xx) so docs can cross-reference each other. Use Mermaid for diagrams. No marketing fluff.

---

## 1. Product summary

- **Name:** Classify (working name). Desired domain `classify.tcu.edu`, but a tcu.edu subdomain needs TCU IT approval, and `tcu.com` is not ours. Until then, use the Azure default URL. Record this as a decision and an open question.
- **One-liner:** Search every TCU class in a clean, fast UI and add classes straight onto your weekly schedule, with no jumping between Class Search, the Purple Schedule Builder, and Rate My Professor.
- **Team:** Elliot Miles and Tanner Temple, TCU students. Both own everything: scraper, front end, back end, and outreach.
- **Status:** MVP. The target is to have the MVP built on Nov 8, 2026. TCU's first undergraduate registration round for Spring 2027 is Thursday, Nov 12, 2026. There is no hard launch date.
- **Disclaimer (must appear in the README and the site footer):** "Unofficial student project. Not affiliated with or endorsed by Texas Christian University."

### What it IS (main use case, in the team's words)
A student opens Classify and gets a cleaner class search: the empty fields aren't shown, it isn't blocky, it flows better, it's fast, and it works just like classes.tcu.edu. The difference is that they can add classes straight from the search onto a schedule. Today they have to go back and forth between Class Search and the Purple Schedule Builder (the schedule tool inside my.tcu.edu). Classify combines those two. Later it adds Rate My Professor directly, so students don't have to jump to RMP either.

### What it is NOT
- Not a schedule recommender. It does **not** build schedules for students; the student builds their own.
- Not a registration system. It **never** enrolls, registers, or drops anyone. Students register in my.tcu.edu.
- Not a degree audit, and it doesn't use student records.

### Background
- TCU's current class search is at classes.tcu.edu (public, backed by PeopleSoft). Searching by instructor and seeing class location require a TCU login.
- TCU's registration happens in my.tcu.edu. There, the "Manage Classes" area offers three ways to enroll: Purple Schedule Builder, Add Classes, and Shopping Cart. Students enroll with the 5-digit **class number**.
- Inspiration:
  - UT Registration Plus, a student-built Chrome extension at UT Austin with 60,000+ users.
  - Stanford's Carta, a student-built course planner that the university later supported with data.
- **Strategy:** students first, TCU second. The team launches to students, then contacts the TCU Registrar and IT after launch. Student usage is the selling point. A later sale or adoption means a TCU security review (other schools take 45+ days), plus a VPAT (accessibility) and a HECVAT (security questionnaire). That's why accessibility and security matter even in the MVP.

### Problems with today's class search (from the team's review)
1. Days and times are text in military time ("1530"), so students cross-check their own calendar.
2. There's no way to add a class to a schedule and see it on a calendar from the search.
3. Reloading the page wipes everything; there's no autosave.
4. The Course Materials button is useless; instructors rarely post anything.
5. Clicking a class opens a new page instead of a pop-up.
6. Some number links (database IDs) do nothing when clicked.
7. The class number column clutters results; students think in course numbers (e.g., ECON 10223).
8. Students juggle two or three extra tabs: the Purple Schedule Builder and Rate My Professor.
9. Empty fields still take up space; the layout is blocky.

---

## 2. Decisions log (create `docs/10-decisions.md` from this)

| ID | Date | Decision | Notes |
|---|---|---|---|
| D-01 | 2026-11-08 | Build a better TCU class search (chosen over an intramurals product) | Intramurals is parked |
| D-02 | 2026-11-08 | Students first; contact the Registrar and IT after launch | Usage is the pitch |
| D-03 | 2026-11-08 | Stack: one Python **Flask** app. Jinja templates with plain JavaScript and CSS; a JSON API from Flask | Team wants Python; Flask over Django for speed |
| D-04 | 2026-11-08 | No database in the MVP. Load the scraped JSON into memory at startup | Data is small and read-only; SQLite or Postgres later if needed |
| D-05 | 2026-11-08 | No login or accounts in the MVP. Schedules autosave in the browser (localStorage) | No cross-device sync in MVP |
| D-06 | 2026-11-08 | Host on **Azure App Service** (Linux, Python) using Azure for Students | $100 credit, 12 months, no credit card, renews each year while a student |
| D-07 | 2026-11-08 | Data: the scraped JSON for **Spring 2027** is committed to the repo; the scraper stays outside the repo | Scraped by subject, A to Z (ADM first) |
| D-08 | 2026-11-08 | Data refresh: once per term, until TCU provides an official feed | Seats/status are a snapshot |
| D-09 | 2026-11-08 | Core curriculum codes are **not** in the MVP; the scraped data doesn't include them | Later: scrape once per Core filter to tag sections |
| D-10 | 2026-11-08 | Hide the class number from result rows; keep the course code as the main ID. The class number appears in the pop-up and in the copy hand-off | my.tcu.edu enrolls by class number |
| D-11 | 2026-11-08 | Rate My Professor: a link-out only in the MVP | Pulling ratings likely breaks RMP's terms |
| D-12 | 2026-11-08 | Instructor names require a TCU login on classes.tcu.edu, so the MVP has no instructor data in general. The team hand-enters instructors and RMP links for a **few showcase classes** in a separate file | Demo only; the full instructor list needs TCU's OK |
| D-13 | 2026-11-08 | Instructor photos: later, from the TCU staff directory | Not MVP |
| D-14 | 2026-11-08 | Product name: Classify (working) | Domain TBD |

---

## 3. Vision & scope (create `docs/01-vision-and-scope.md`)

**Vision:** A TCU student finds classes and builds their own weekly schedule on one fast, clean page, without switching between Class Search, the Purple Schedule Builder, and RMP. Then they register in my.tcu.edu.

**Users**

| User | Need | MVP? |
|---|---|---|
| Undergraduate student registering for next term | Find classes fast; add them to a weekly calendar; see conflicts | Yes, primary |
| First-year student | Read times and sections without decoding them | Yes |
| Team admin (Elliot, Tanner) | Replace the term data file and redeploy | Yes, internal |
| Advisors | See a student's planned schedule | Later |
| TCU Registrar / IT | An official data feed, endorsement, and eventually adoption | Later (pitch after launch) |

**In scope (MVP)**
- Search and filter all Spring 2027 classes:
  - subject
  - course number
  - title keyword
  - days
  - start time
  - status (open/closed)
  - session
  - instruction mode
  - course level
  
  Use only the fields the data supports.
- Clean result rows. Each row shows the course code and title first, 12-hour times, and day names. Empty fields are not shown. There is no class number column, no Course Materials button, and no dead links.
- A course detail pop-up (not a new page) that shows every non-empty field, including the class number with a copy button.
- **Add to schedule straight from search**, onto a weekly calendar. Conflicts are flagged.
- Remove, swap, and show/hide sections on the calendar.
- Autosave in the browser. A reload keeps the schedule.
- Hand-off: a "Copy class numbers" button plus a link to my.tcu.edu.
- RMP link-out for the hand-entered showcase instructors only.
- A data timestamp on every data screen ("Class data as of …").
- Works on phones.
- An "Unofficial student project" footer.

**Out of scope (MVP)**
- Registration or enrollment of any kind.
- Login, TCU SSO, and student records.
- Live seat counts.
- Core codes, the "what I still need" checklist, recommended schedules, and degree audit.
- RMP ratings shown in the app, course scores, and grade distributions.
- Instructor photos and the full instructor list.
- Sharing schedules between users.
- Intramurals, events, transfer credit, and room finders.

**Success measures:** Students plan real schedules with it for the Spring 2027 registration window, and the team can show usage numbers to TCU. Specific targets are TBD; add this to open questions.

---

## 4. Business rules (create `docs/02-business-rules.md`)

| ID | Rule | Why | Status |
|---|---|---|---|
| BR-01 | The app never registers, enrolls, or drops a student. It ends with a hand-off to my.tcu.edu. | Only TCU's system can enroll | Confirmed |
| BR-02 | Use only data shown publicly on classes.tcu.edu. Never collect data from pages behind the TCU login. Exception: hand-entered instructors for a few showcase classes (D-12). | TCU gates instructor and location on purpose | Confirmed |
| BR-03 | The external scraper is polite: low request rate, off-peak hours, and never run during registration rushes. | Protect TCU's servers and goodwill | Confirmed |
| BR-04 | Every data screen shows when the data was scraped. | Status changes after the scrape | Confirmed |
| BR-05 | Open/closed status is labeled as a snapshot, never as live. | Live seats need TCU's data | Confirmed |
| BR-06 | Times show in 12-hour format with AM/PM; days show as names ("Mon, Wed, Fri"). | "1530" is the top complaint | Confirmed |
| BR-07 | The course code (e.g., ECON 10223) is the main ID. The class number is hidden from results but shown in the pop-up and the copy hand-off. | Students think in course codes; my.tcu.edu enrolls by class number | Confirmed |
| BR-08 | Two sections conflict only when they share a day, their times overlap, and their date ranges overlap. If a date range can't be determined, assume it overlaps. | Different-half 8-week sessions don't clash | Confirmed; date range source TBD from data |
| BR-09 | A conflict is a warning, not a block. Both sections stay on the calendar. | Students compare backups | Confirmed |
| BR-10 | Sections with no set meeting time (online, arranged, TBA) go in an "Unscheduled" list under the calendar. | Can't be placed on a grid | Confirmed |
| BR-11 | Linked components (lecture plus lab) are added together only if the data links them. | Students need both to register | TBD; check if the data has links |
| BR-12 | The schedule autosaves to the browser after every change. No account needed. | Reloading today wipes everything | Confirmed |
| BR-13 | Rate My Professor is a link-out only; the app doesn't copy RMP ratings or reviews. | RMP's terms | Confirmed |
| BR-14 | Instructor photos are not in the MVP. If added later, they come only from TCU's staff directory. | Don't pull people's photos from random sources | Confirmed (later) |
| BR-15 | Schedules are private. Any future sharing is opt-in and link-only, with no public directory of who's where. | Safety: knowing where someone is at a given time | Confirmed |
| BR-16 | The site says "Unofficial student project, not affiliated with TCU" and uses no TCU logos or marks. | Trademarks; don't look official before endorsement | Confirmed |
| BR-17 | No personal data is collected. At most, anonymous aggregate usage counts. | Keeps a later FERPA/security review simple | Confirmed |
| BR-18 | Fields with no value are not rendered: no empty columns, labels, or placeholders. | Team's main UI complaint | Confirmed |
| BR-19 | Remove the Course Materials button and any link that does nothing. | They're useless today | Confirmed |
| BR-20 | Core curriculum codes aren't shown or filterable in the MVP. | Not in the scraped data (D-09) | Confirmed |

---

## 5. Data (create `docs/06-data-dictionary.md`)

**Source:** classes.tcu.edu public search results for **Spring 2027**, scraped by subject (ADM first, then each subject in order). The data is committed to the repo as JSON. One scrape per term.

**Fields the team says the public results row shows** (confirm each against the JSON and record its exact key name):
- Class number (5-digit; used to enroll in my.tcu.edu)
- Course (subject and catalog number, e.g., ECON 10223)
- Note
- Section (Sec)
- Session (Ses), e.g., REG = Regular; 8W1/8W2 = 1st/2nd Eight Week (the full code list is on classes.tcu.edu)
- Title / Topic
- Start date
- Instruction mode
- Days & time
- Status (open/closed)
- Enroll max
- Reserve max (Rsv max)
- Wait max
- Course materials (do not display; BR-19)

**Not in the public data:** instructor (login required), room/location (login required), Core codes, course description, credit hours. If the JSON turns out to include any of these, document them and tell me.

**Your tasks for this doc:**
1. Make a table with these columns: raw JSON key, meaning, example values, % empty, how it's displayed in Classify, and notes.
2. Write the **normalized model** the app will use in memory. Draft it like this and adjust it to the real data:
   - `Section`: class_nbr, subject, catalog_nbr, course_code, title, section, session_code, session_name, start_date, end_date (derive from the session if possible, else null), instruction_mode, status, enroll_max, rsv_max, wait_max, note, meetings[]
   - `Meeting`: days[] (Mon..Sun), start_time, end_time (24h internally, 12h on display)
   - `Term`: code ("2027 Spring"), scraped_at (ISO timestamp), source ("classes.tcu.edu")
3. Write the parsing rules:
   - how to parse "days & time" strings, including TBA, online, and multiple meeting patterns
   - day letter codes: classes.tcu.edu uses M, T, W, R (Thursday), F, SA, SU, and combos like MWF, TR, MW
   - how to handle duplicates, since scraping by subject can repeat cross-listed classes
4. Define the hand-entered showcase instructor file. Propose `data/instructors_showcase.json`:
   ```json
   [{"class_nbr": "12345", "instructor_name": "…", "rmp_url": "https://www.ratemyprofessors.com/…"}]
   ```
   Keep it empty or with clearly fake placeholder values. **Do not** look up or invent real professor names or URLs.
5. Write a "data refresh runbook": replace the JSON, update `scraped_at`, run the validation script, and redeploy.

---

## 6. Use cases (create `docs/03-use-cases.md`)

Actors: **Student** (primary), **Admin** (Elliot or Tanner), and **my.tcu.edu** (external; TCU's registration system).

| ID | Use case | Actor | Main flow | MVP? |
|---|---|---|---|---|
| UC-01 | Search classes | Student | Open Classify → term is Spring 2027 → type a subject, course number, or title words → results appear instantly | Yes |
| UC-02 | Filter results | Student | Narrow by days, start time, status, session, instruction mode, course level → list updates live | Yes |
| UC-03 | View class details | Student | Tap a result → pop-up (not a new page) shows every non-empty field, 12-hour times, session dates, status as of scrape, class number with copy | Yes |
| UC-04 | Check the professor | Student | For showcase classes, tap "Rate My Professor" in the pop-up → RMP opens in a new tab | Yes (showcase only) |
| UC-05 | Add to schedule from search | Student | Tap Add on a result or in the pop-up → the section appears on the weekly calendar at once → conflicts are flagged | Yes |
| UC-06 | Manage the schedule | Student | Remove a section, swap it for another section of the same course, or hide/show backups | Yes |
| UC-07 | Keep the schedule | Student | Close or reload → the schedule restores from browser storage | Yes |
| UC-08 | Hand off to register | Student | Tap "Copy class numbers" → open my.tcu.edu → enroll via the Purple Schedule Builder, Add Classes, or Shopping Cart | Yes |
| UC-09 | Refresh class data | Admin | Replace the JSON → validate → redeploy → the timestamp updates | Yes (internal) |
| UC-10 | Filter by Core requirement | Student | Pick a Core code → see sections that satisfy it | Later (needs per-Core scrape) |
| UC-11 | See RMP ratings in the app | Student | Ratings shown inline | Later (needs a permitted source) |
| UC-12 | See instructor photos and names for all classes | Student | Photo and name in the pop-up | Later (needs TCU's OK or a directory scrape) |
| UC-13 | Share a schedule | Student | Opt-in private link | Later |
| UC-14 | Sign in with TCU; "what I still need" | Student | App knows remaining requirements | Later (needs TCU) |
| UC-15 | Recommended schedule / course score | Student | — | Later, maybe never; not the product's main job |

For each MVP use case, also write:
- preconditions
- the main flow as numbered steps
- alternate flows and edge cases. At minimum cover: no results; the class is closed; a TBA/online section; a conflict; duplicate add; storage full or disabled; the data is stale.
- postconditions
- the related BR and FR IDs

Include a Mermaid flowchart of the main student journey:
Search → Filter → Open pop-up (optional: RMP link) → Add to schedule → Conflict? (yes: try another section, back to results; no: continue) → Copy class numbers → Register in my.tcu.edu (outside the app).

---

## 7. Requirements (create `docs/04-requirements.md`)

Write **functional requirements (FR-xx)** with testable acceptance criteria (Given/When/Then), each traced to UC and BR IDs. Cover at least:
- search (instant, case-insensitive, matches subject/number/title)
- each filter
- the result row content and BR-18 empty-field hiding
- the pop-up
- the copy-to-clipboard class number
- add/remove/swap/hide
- the calendar grid: Mon–Fri, 8 AM–10 PM by default, expanding when a class falls outside that range; Sat/Sun shown only if needed
- conflict detection per BR-08/BR-09
- the Unscheduled list (BR-10)
- autosave (BR-12)
- "Copy class numbers" for all scheduled sections, plus the my.tcu.edu link
- the data timestamp (BR-04)
- the footer disclaimer (BR-16)
- the showcase RMP link
- the mobile layout: two tabs, Search and My schedule
- a `/api/health` endpoint
- JSON API endpoints (propose: `GET /api/sections` with query params, `GET /api/sections/<class_nbr>`, `GET /api/meta` with term and scraped_at)

Write **non-functional requirements (NFR-xx)**:
- **Performance:** first page load is fast on campus Wi-Fi, and search/filter feels instant. Set concrete targets and flag them as proposed.
- **Registration-day traffic:** the whole term's data is served from memory, responses are gzip-compressed, and static assets are cached.
- **Mobile:** responsive down to 375 px wide.
- **Accessibility:** target WCAG 2.1 AA (keyboard navigation, focus states, contrast, labels, and a pop-up that traps focus and closes on Esc). This feeds a future VPAT.
- **Security:**
  - no personal data
  - no secrets in the repo (`.env.example` only)
  - HTTPS only on Azure
  - security headers (CSP, X-Content-Type-Options, Referrer-Policy)
  - pinned dependencies
  - input validation on API params
  
  This feeds a future HECVAT.
- **Privacy:** schedules never leave the browser in the MVP.
- **Reliability:** if the data file is missing or invalid, the app fails loudly at startup, and validation runs as a test.
- **Maintainability:** pytest tests; ruff lint and format; type hints; small modules.
- **Browser support:** current Chrome, Safari (including iOS), Edge, and Firefox.
- **Cost:** stays within the Azure for Students credit.

End with a **traceability matrix**: a table mapping FR → UC → BR.

---

## 8. Architecture (create `docs/05-architecture.md`)

- **One Flask app** using the app-factory pattern. On startup it loads the JSON into memory, normalizes it into `Section`/`Meeting` objects, and builds simple indexes (by subject and by class number).
- **Server-rendered** Jinja page shell plus **plain JavaScript** modules. Search and filter can run in the browser on a JSON payload, or through the API. Recommend one approach with reasons, and record the choice as a decision.
- **No database** in the MVP (D-04). The schedule is stored in browser localStorage under a versioned key (e.g., `classify.schedule.v1`). Store only class numbers and visibility flags, never personal data.
- The **conflict detection and time formatting** logic lives in pure, unit-tested functions. If logic is needed on both sides, keep one source of truth and explain how.
- Include a Mermaid diagram:
  - data JSON (repo) → Flask loader/normalizer → in-memory store → API and pages → browser (search UI, calendar, localStorage)
  - the my.tcu.edu hand-off and RMP link-out shown as external
- **Future path:**
  - SQLite or PostgreSQL if the data grows or accounts arrive
  - an official TCU data feed replacing the scrape
  - Azure App Service scaling
- **Risks:**
  - TCU changes classes.tcu.edu and the scraper breaks
  - TCU may move off PeopleSoft (many schools are moving to Workday), and the data source changes
  - registration-day traffic
  - stale status data
  - the bus factor after the team graduates in May 2027 (recommend a student org to take over)

---

## 9. UI spec (create `docs/07-ui-spec.md`)

**Desktop: one page.**
- Left: a filter rail and the results list.
- Right: the weekly calendar.
- Top: "Classify", the term ("Spring 2027"), and "Class data as of …".
- Bottom: the footer disclaimer.

**Mobile:** two tabs, Search and My schedule. The Add button gives visible feedback, such as a toast and a badge count on the My schedule tab.

**Result row:**
- course code and title (bold)
- section
- session (only if not Regular)
- "Mon, Wed, Fri · 9:00–9:50 AM"
- instruction mode (only if not in-person, or always; decide from the data)
- status chip "Open as of Nov 8"
- an Add button that toggles to "Added ✓"
- no class number, no Course Materials, no empty fields

**Pop-up:** every non-empty field in readable labels, the class number with a copy button, a note, session dates, max seats (enroll/reserve/wait), an RMP link if showcase, and Add/Remove. Esc and outside-click close it.

**Calendar:**
- colored blocks with the course code, time, and section
- conflicts get a red outline plus a banner naming the clashing classes
- hidden backups shown in gray, toggleable
- an "Unscheduled" list underneath
- top actions: "Copy class numbers" and "Register in my.tcu.edu ↗"

**States:** loading, no results, empty schedule (with a hint), data stale warning, storage unavailable.

**Visual direction:** clean, not blocky, generous spacing, a neutral palette with one purple accent (a nod to TCU without using TCU logos or official marks), system fonts.

If screenshots of classes.tcu.edu exist in the repo, add a "current vs Classify" comparison table.

---

## 10. Deployment (create `docs/08-deployment-azure.md`)

- **Target:** Azure App Service, Linux, Python 3.12 (or the newest Python App Service supports; check), run by gunicorn. Startup command, for example: `gunicorn --bind=0.0.0.0 --timeout 120 "app:create_app()"`. Adjust to the scaffold.
- **Account:** Azure for Students ($100 credit for 12 months, no credit card, renewable each year while a verified full-time student). Recommend setting a budget alert.
- **Plan tier:** document the free tier vs. a low-cost Basic tier and their limits (CPU quotas, always-on, custom domains). **Do not state prices or quotas as fact unless you verify them from Microsoft's current docs.** Otherwise mark them "check current pricing". Recommend starting free and moving up before registration-day traffic if quotas are hit.
- **Deploy:** GitHub Actions to App Service (include a workflow file in the scaffold, disabled or commented until secrets are set). Also document manual deploy with the Azure CLI (`az webapp up`) as a fallback.
- **Config:** environment variables documented in `.env.example` (e.g., `CLASSIFY_DATA_PATH`, `FLASK_ENV`). No secrets in the repo.
- **Domain:** the Azure default `*.azurewebsites.net` for now; `classify.tcu.edu` needs TCU IT (open question).

---

## 11. Roadmap (create `docs/09-roadmap.md`)

- **MVP (now):** everything in scope above.
- **Next (after launch feedback):**
  - Core code tagging (scrape once per Core filter, D-09)
  - Fall term toggle
  - anonymous usage counts
  - user testing with 5 classmates
  - contacting the TCU Registrar and IT with usage numbers
- **Later:**
  - instructor names for all classes (needs TCU's OK) and photos (staff directory)
  - RMP ratings in-app (needs a permitted source)
  - TCU SSO
  - "what I still need" from student records
  - opt-in schedule sharing (BR-15)
  - an official data feed
  - live seats
  - VPAT and HECVAT for a TCU review
- **Parked:** intramurals.
- **Rejected:**
  - empty classroom finder (classrooms lock)
  - 4-year degree planner (not feasible with this data)
  - campus events feed (off-topic)
  - transfer course tool (a separate problem)

---

## 12. Open questions (create `docs/11-open-questions.md`)

Start with these, then add anything you discover while reading the repo:

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-01 | Exact JSON key names and formats (confirm against data) | Team | Data dictionary |
| OQ-02 | Does the data contain session end dates, or must they be derived from session codes? | Team | BR-08 |
| OQ-03 | Does the data link lectures to labs/recitations? | Team | BR-11 |
| OQ-04 | Which showcase classes and instructors to hand-enter, and who verifies the RMP links | Team | UC-04 |
| OQ-05 | Success targets (e.g., number of students who build a schedule before Nov 12) | Team | Vision |
| OQ-06 | Domain: request `classify.tcu.edu` from TCU IT after launch? | Team | Deployment |
| OQ-07 | License (MIT, all rights reserved, or other) | Team | README |
| OQ-08 | Azure App Service tier for registration week | Team | Deployment |
| OQ-09 | Anonymous analytics: add in MVP or after? Which tool? | Team | BR-17 |

---

## 13. Meeting notes (create `docs/meeting-notes/2026-11-08-kickoff.md`)

Summarize the Nov 8 kickoff using sections 1–12:
- **Decisions:** D-01 to D-14.
- **How students choose a class today:**
  1. identify the requirement they need
  2. look at every class that fills it and drop the unappealing ones
  3. check the shortlist on Rate My Professor
  4. pick the class with strong ratings that fits their schedule
- **Ideas parked or rejected:** see section 11.
- **Note:** a 14-minute recording and full transcript exist outside the repo.

---

## 14. README.md (repo root)

Include, in this order:
1. **Classify**: the one-liner and the disclaimer.
2. Why it exists (the problems list, short).
3. MVP features (bullets) and what it does NOT do (doesn't register, doesn't recommend schedules).
4. Screenshot placeholder.
5. Tech stack: Flask, Jinja, plain JS/CSS, data in JSON, Azure App Service.
6. Quick start:
   - `python -m venv .venv`
   - activate it
   - `pip install -r requirements.txt`
   - `cp .env.example .env`
   - `flask --app app run --debug` (match the scaffold)
   - run tests with `pytest`
   - lint with `ruff check .`
7. Project structure (tree).
8. Updating class data (link to the runbook).
9. Deploying (link to the deployment doc).
10. Docs index (a link to every file in `docs/`).
11. Roadmap (short) and how to contribute.
12. Team: Elliot Miles and Tanner Temple.
13. License: TBD (OQ-07).

---

## 15. CLAUDE.md (repo root)

Guidance for future Claude Code sessions:
- project purpose
- the main use case and the "is / is not" list
- stack and commands (run, test, lint)
- folder map
- the hard rules:
  - never add registration
  - never scrape behind login
  - never add personal data collection
  - never invent instructor names or RMP links
  - hide empty fields
  - 12-hour times
  - BR IDs are law
- coding conventions: type hints, small pure functions for time/conflict logic, tests for every parser and the conflict rule
- where docs live, and that docs must be updated when behavior changes

---

## 16. Scaffold (minimal and runnable; no feature implementation)

Create this structure (adjust names if the repo already has conventions, and tell me):

```
app/
  __init__.py          # create_app(): loads config, loads data, registers blueprints
  config.py
  data_loader.py       # load + validate JSON; stubs for normalize() with TODO FR refs
  models.py            # dataclasses: Term, Section, Meeting
  timefmt.py           # stub: 24h→12h, day-code parsing (TODO FR refs)
  conflicts.py         # stub: overlap rule per BR-08 (TODO)
  routes/
    __init__.py
    pages.py           # "/" renders index.html shell
    api.py             # /api/health (working), /api/meta (working), /api/sections (stub)
  templates/
    base.html          # header, footer disclaimer, data timestamp slot
    index.html         # empty layout regions: filters, results, calendar
  static/
    css/app.css
    js/app.js          # module stubs: search, calendar, storage (TODO)
data/
  instructors_showcase.json   # empty array or fake placeholders only
scripts/
  validate_data.py     # checks the JSON loads and required keys exist
tests/
  test_health.py       # /api/health returns 200
  test_data_loads.py   # JSON loads; record count > 0
  test_timefmt.py      # placeholder tests marked xfail until implemented
.github/workflows/azure-deploy.yml   # commented/disabled until secrets exist
.env.example
.gitignore             # Python, venv, .env, OS files
requirements.txt       # pinned: flask, gunicorn; dev: pytest, ruff (or requirements-dev.txt)
pyproject.toml         # ruff + pytest config
```

**Acceptance for this session:**
- `flask --app app run` serves a page showing "Classify", the term, the data timestamp, and the footer disclaimer.
- `/api/health` and `/api/meta` work.
- `pytest` passes, with xfails allowed.
- `ruff check .` passes.
- Every doc in `docs/` exists and cross-links by ID.
- The README's links all resolve.

---

## 17. Final output

When done, print:
1. a table of every file created, with a one-line purpose
2. what you learned from the JSON: record count, fields, empty rates, surprises
3. every new open question you added
4. the commands to run the app and tests

Do not commit.