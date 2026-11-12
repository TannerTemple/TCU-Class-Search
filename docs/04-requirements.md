# Requirements

IDs trace to [use cases](03-use-cases.md) and [business rules](02-business-rules.md). Numeric targets are **proposed** until the team confirms them.

## Functional requirements

Acceptance criteria use **G** (Given), **W** (When), and **T** (Then).

### Search and filters

| ID | Requirement | Acceptance | UC | BR |
|---|---|---|---|---|
| FR-01 | One search box matches subject, course number, and title. It is instant and case-insensitive. | **G** the data is loaded. **W** the student types `econ`, `10223`, or `sociology`. **T** matching sections list while typing, with no page reload and no difference for upper or lower case. | UC-01 | BR-07 |
| FR-02 | Subject filter. | **G** 123 subjects in the data. **W** the student picks ACCT. **T** only ACCT sections list. | UC-01 | — |
| FR-03 | Days filter: a row of day toggles (M, T, W, Th, F, Sa, Su) with two match modes (D-44). **Includes** (default): a section matches when it meets on at least one selected day. **Only these days**: every meeting day must be selected. Sections with no set time never match. | **G** Tue is selected. **W** the list updates. **T** a TR section is listed and a MWF section isn't. **G** Mon, Wed, Fri with Only these days. **T** a MWF section is listed, a TR section isn't, and a TBA section isn't. | UC-02 | BR-06 |
| FR-04 | Start time filter: Morning (before 12 PM), Afternoon (12–5 PM), and Evening (5 PM on) chips, any combination, or "Exact time", which opens a two-handle slider from 6:00 AM to 10:00 PM in 15-minute steps, shown in 12-hour time. A handle at its end means no limit. | **G** a range of 9:00 AM to 11:00 AM. **W** the list updates. **T** sections starting within the range, inclusive, are listed, and sections with no set time aren't. **G** Evening. **T** a 6:30 PM section is listed and an 8:00 AM one isn't. | UC-02 | BR-06 |
| FR-05 | Status filter: one "Open classes only" switch (D-46). | **G** the switch is on. **W** the list updates. **T** `Open` rows are listed and `DeptPermit`, `InstrPermit`, and `Closed` rows aren't. | UC-02 | BR-05, BR-21 |
| FR-06 | Session filter built from session codes in the data. | **G** session 8W1. **W** the list updates. **T** only 8W1 sections are listed. | UC-02 | — |
| FR-07 | Instruction mode filter. | **G** mode is Online Only. **W** the list updates. **T** only Online Only sections are listed. | UC-02 | — |
| FR-08 | Course level filter with three bands: 10000–29999, 30000–49999, and 50000 and up (D-26). | **G** band 30000–49999. **W** the list updates. **T** ACCT 30153 is listed and ACCT 20353 isn't. | UC-02 | — |
| FR-09 | Core filter with all 14 codes. Once two or more are checked, an "Any selected / Double dip" switch shows (D-47). **Any** (default): a section matches when it has any selected code. **Double dip**: it must have every selected code, so one class covers them all. | **G** HUM is selected. **W** the list updates. **T** sections whose `core_codes` include HUM are listed. **G** CA and GA with Double dip. **T** only the 6 Spring sections with both codes are listed. | UC-10 | BR-20 |
| FR-10 | Search and filters combine with AND, and can all be cleared in one action. | **G** two active filters. **W** the student clears filters. **T** the full list returns. | UC-02, UC-10 | — |

### Results and pop-up

| ID | Requirement | Acceptance | UC | BR |
|---|---|---|---|---|
| FR-11 | Results are one card per course (course code and title), with a credit-hours badge (D-41) and Core tags by name. Each matching section is a row: a section badge, a component badge, session if not REG, instruction mode if not In Person, 12-hour days and times as plain text, a status dot, and an Add or Switch button. A card shows 5 rows, then "Show N more sections". All matches are reachable through "Show more courses". | **G** a MWF 9:00-9:50 REG section. **W** it renders. **T** it reads "Mon, Wed, Fri · 9:00–9:50 AM", shows no session and no class number. **G** ACCT 20353. **T** its 16 sections share one card with a "3 cr" badge. | UC-01, UC-10 | BR-06, BR-07, BR-20 |
| FR-12 | Fields with no value render nothing. | **G** a section with no Core codes and no reserve limit. **W** its row and pop-up render. **T** none of those labels appear. | UC-01, UC-03, UC-04, UC-10 | BR-18 |
| FR-13 | No Course Materials control and no links that do nothing. | **G** any page. **W** every link is checked. **T** none points to Course Materials, and every link goes somewhere. | UC-01, UC-03 | BR-19 |
| FR-14 | Tapping a section badge opens a same-page pop-up with every non-empty field: seat maximums, start date, status with permit detail, Core codes, and a "Course description (TCU) ↗" link (D-24). `note` is never shown (D-27). | **G** a result. **W** it is tapped. **T** the URL doesn't change, the pop-up opens, and Esc or an outside click closes it. | UC-03, UC-10 | BR-05, BR-06, BR-07, BR-18, BR-21 |
| FR-15 | The pop-up shows the class number with a copy button. | **G** an open pop-up. **W** Copy is tapped. **T** the 5-digit number is on the clipboard and a confirmation shows. | UC-03 | BR-07 |

### Schedule

| ID | Requirement | Acceptance | UC | BR |
|---|---|---|---|---|
| FR-16 | Add from a result or the pop-up. One entry per class number. | **G** a section not on the schedule. **W** Add is tapped. **T** it appears at once, the button reads "Added ✓", and a second add creates no duplicate. | UC-05 | BR-09 |
| FR-17 | Remove a section, from My schedule or with the × beside "Added ✓" in the results. | **G** a scheduled section. **W** Remove is tapped. **T** it leaves the calendar and its result returns to Add. | UC-06 | BR-12 |
| FR-18 | Switch a section for another section of the same course, title, and component type, in place: from the section picker on the schedule, or the Switch button on that course's other rows in the results. | **G** a course with 4 lectures and 23 labs, with a lab scheduled. **W** the student opens the picker. **T** only the other 22 labs are offered, and the chosen one replaces the original in the same place in the list. **G** ACCT 20353 section 002 scheduled. **W** Switch is pressed on section 010. **T** 010 replaces 002. | UC-06 | BR-09, BR-12 |
| FR-19 | Hide or show a section. Hidden sections are gray and don't count as conflicts. | **G** two conflicting sections. **W** one is hidden. **T** it turns gray and the warning clears. | UC-06 | BR-09, BR-12 |
| FR-20 | Calendar grid: Mon–Fri, 8 AM–6 PM by default (D-45), shown even when the schedule is empty. It expands when a class falls outside that range. Sat and Sun show only if needed. | **G** a section at 6:00 AM, 7:00 PM, or on Saturday. **W** it is added. **T** the grid expands, then returns to default when it is removed. | UC-05 | BR-06 |
| FR-21 | Conflict rule: same day, overlapping times, and overlapping date ranges. An unknown end date counts as overlapping. Touching times don't overlap. Result rows that would clash with a visible scheduled section are tinted, and say "Overlaps" and name it; their button still works (BR-09). | **G** an 8W1 and an 8W2 section at the same time. **W** both are scheduled. **T** no conflict. **G** two REG sections with the same day and time. **T** conflict. **G** one ends at 9:50 and one starts at 9:50. **T** no conflict. **G** ACCT 20353 MWF 9:00 scheduled. **W** ECON 10223 MWF 9:00 is listed. **T** its row reads "Overlaps ACCT 20353 · 010". | UC-05, UC-06 | BR-08 |
| FR-22 | Conflicts are warnings: a red outline and a banner naming the classes. Both stay. | **G** two conflicting sections. **W** the second is added. **T** both stay on the calendar, both are outlined, and the banner names both. | UC-05, UC-06 | BR-09 |
| FR-23 | Sections without a set time go to an Unscheduled list under the calendar. | **G** a section with `days` TBA, `time` ARR or `:-:`. **W** it is added. **T** it is listed under the calendar and not on the grid. | UC-05 | BR-10 |
| FR-24 | The schedule autosaves after every change under `classify.schedule.v1`, storing only term code, class numbers, and visibility flags. | **G** any schedule change. **W** storage is read. **T** it matches the schedule and contains nothing else. | UC-05, UC-06, UC-07 | BR-12, BR-15, BR-17 |
| FR-25 | The saved schedule restores on load. | **G** a saved schedule with a hidden section. **W** the page reloads. **T** the same sections and hidden flag return. Unknown class numbers are dropped with a notice. | UC-07 | BR-12 |
| FR-26 | If storage is full or disabled, the app keeps working and warns that changes won't be saved. | **G** storage throws an error. **W** a section is added. **T** it appears and the warning shows. | UC-05, UC-06, UC-07 | BR-12 |

### Hand-off, labels, and layout

| ID | Requirement | Acceptance | UC | BR |
|---|---|---|---|---|
| FR-27 | Each scheduled class, including Unscheduled and hidden ones, has its own copy button for its class number. There is no bulk copy (D-31). | **G** a schedule of 3 sections. **W** Copy is tapped on one. **T** only that number is on the clipboard and a confirmation shows. | UC-08 | BR-01, BR-07 |
| FR-28 | A "Register on classes.tcu.edu ↗" link opens `https://psb.is.tcu.edu/criteria.jsp` in a new tab (D-42). The app has no enroll action. | **G** the schedule. **W** the link is tapped. **T** the page opens in a new tab and nothing is sent to it. | UC-08 | BR-01 |
| FR-29 | Every data screen shows "Class data as of …" from `scraped_at`. | **G** `scraped_at` is Nov 8, 2026. **W** the page loads. **T** it reads "Class data as of Nov 8, 2026". | UC-01, UC-09 | BR-04 |
| FR-30 | Status always reads as a snapshot (D-43). | **G** an Open section. **W** it renders. **T** the row shows a green dot and "Open", the results summary reads "Seat status as of Nov 8", screen readers hear "Open as of Nov 8", and the word "live" appears nowhere. | UC-01, UC-08 | BR-05 |
| FR-31 | **Later, not in the MVP (D-28).** A stale warning shows when the data is older than a set age. | Not tested in the MVP. | UC-01, UC-09 | BR-04, BR-05 |
| FR-32 | Every page footer shows the disclaimer. No TCU logos or marks appear. | **G** any page. **W** it renders. **T** the footer reads "Unofficial student project. Not affiliated with or endorsed by Texas Christian University." | UC-01 | BR-16 |
| FR-33 | Showcase sections show the instructor and an RMP link that opens a new tab. | **G** a class number in the showcase file. **W** its pop-up opens. **T** the name shows, and the link shows if `rmp_url` isn't empty. **G** any other section. **T** neither shows. | UC-04 | BR-02, BR-13, BR-18 |
| FR-34 | Mobile layout has two tabs: Search and My schedule. Add gives a toast and a badge count on My schedule. | **G** a 375 px screen. **W** Add is tapped. **T** a toast shows and the badge count rises by 1. | UC-05 | — |
| FR-41 | The UI has loading, no-results, empty-schedule, and data-load-error states. | **G** a search with no matches. **W** the list updates. **T** a no-results message and a clear action show. | UC-01, UC-02 | — |
| FR-42 | When a section's course also lists LAB sections, its pop-up and schedule entry say so and offer to show them. Nothing is added automatically (D-32). | **G** BIOL 10003 lecture section 010. **W** its pop-up opens. **T** it reads "This course also lists 23 lab sections", and tapping that lists them. | UC-03, UC-05 | BR-11 |
| FR-44 | Hovering or focusing a result row previews it on the calendar as a dashed, see-through block. Parts that overlap a scheduled class turn red, and that class gets a red ring. A section that Switch would replace fades. Nothing is saved. | **G** ACCT 20353 MWF 9:00 scheduled. **W** the student hovers ECON 10223 MWF 9:00. **T** red ghost blocks show on Mon, Wed, and Fri at 9 AM beside the ACCT blocks, and leave when the pointer does. | UC-05 | BR-08, BR-09 |
| FR-45 | The My schedule header shows the total credit hours: each course counts once, hidden backups don't count, and variable-credit courses add "+ variable" (D-41). Hidden when the schedule is empty. | **G** ACCT 20353 and MATH 10524 scheduled. **W** the header renders. **T** it reads "7 credit hours". | UC-05 | BR-18 |
| FR-43 | Sections listed in `data/overrides.json` as possibly incomplete show "Meeting times may be incomplete. Check classes.tcu.edu." in the pop-up and on the schedule (D-33). | **G** class 35029. **W** its pop-up opens. **T** the note shows. **G** a section not on the list. **T** it doesn't. | UC-03, UC-05 | BR-08 |

### API and data

| ID | Requirement | Acceptance | UC | BR |
|---|---|---|---|---|
| FR-35 | `GET /api/health` returns status. | **W** it is called. **T** 200 and `{"status": "ok"}`. | UC-09 | — |
| FR-36 | `GET /api/sections` returns all sections. Optional params: `q`, `subject`, `days`, `days_match` (`any`, the default, or `only`, as in FR-03), `core_match` (`any`, the default, or `all`, as in FR-09), `start_from`, `start_to`, `status`, `session`, `mode`, `level`, `core`. | **W** called with no params. **T** all sections. **W** `status=Open`. **T** only Open sections. **W** a bad value such as `level=x`. **T** 400 with a JSON error. | UC-01, UC-02, UC-10 | BR-02, BR-21 |
| FR-37 | `GET /api/sections/<class_nbr>` returns one section. | **W** a valid number. **T** 200. **W** an unknown number. **T** 404. **W** not 5 digits. **T** 400. | UC-03 | BR-07 |
| FR-38 | `GET /api/meta` returns the term and `scraped_at`. | **W** it is called. **T** 200 with `term_code`, `term_name`, `scraped_at`, `source`, and `record_count`. | UC-09 | BR-04 |
| FR-39 | At startup the loader normalizes every record into `Section` and `Meeting` objects and indexes them by subject and class number, following the [data dictionary](06-data-dictionary.md). | **G** Spring data. **W** the app starts. **T** 3,926 sections load, rows without set times have no meetings, rows sharing a class number merge, and class 35782 meets Tuesdays 12:00–1:00 PM (D-29, D-33). | UC-09 | BR-02, BR-06, BR-10, BR-21 |
| FR-40 | `scripts/validate_data.py` exits non-zero for invalid data and lists warnings for suspect rows. | **G** a file missing a required key. **W** it runs. **T** it exits 1 and names the key. | UC-09 | BR-04 |

## Non-functional requirements

| ID | Area | Requirement | Verified by |
|---|---|---|---|
| NFR-01 | Performance | Proposed targets: first page load within 2 seconds on campus Wi-Fi. Search and filter update within 100 ms on a mid-range phone. API responses within 200 ms at the 95th percentile. Results render 25 courses at a time; more load on scroll or with "Show more courses". | Browser performance tools; a load test |
| NFR-02 | Registration-day traffic | The whole term's data is served from memory. Responses are gzip-compressed, and static assets are cached. Proposed: section payload at most 150 KB gzipped (111 KB measured on current data). | Response headers; payload check |
| NFR-03 | Mobile | Responsive down to 375 px wide, with no horizontal page scroll. | Manual check at 375 px |
| NFR-04 | Accessibility | Target WCAG 2.1 AA: keyboard navigation, focus states, contrast, labels, and a pop-up that traps focus and closes on Esc. Feeds a future VPAT. | Automated audit plus a keyboard walkthrough |
| NFR-05 | Security | No personal data. No secrets in the repo (`.env.example` only). HTTPS only on Azure. Security headers: CSP, X-Content-Type-Options, Referrer-Policy. Pinned dependencies. Input validation on API params. Feeds a future HECVAT. | Header check; config review; tests |
| NFR-06 | Privacy | Schedules never leave the browser in the MVP. | Network inspection during schedule changes |
| NFR-07 | Reliability | If the data file is missing or invalid, the app fails loudly at startup. Validation runs as a test. | `tests/test_data_loads.py` |
| NFR-08 | Maintainability | pytest tests, ruff lint and format, type hints, and small modules. | `pytest`, `ruff check .`, `ruff format --check .` |
| NFR-09 | Browser support | Current Chrome, Safari (including iOS), Edge, and Firefox. | Manual check |
| NFR-10 | Cost | Stays within the Azure for Students credit. A budget alert is set. | Azure cost view |

## Traceability matrix

| FR | UC | BR |
|---|---|---|
| FR-01 | UC-01 | BR-07 |
| FR-02 | UC-01 | — |
| FR-03 | UC-02 | BR-06 |
| FR-04 | UC-02 | BR-06 |
| FR-05 | UC-02 | BR-05, BR-21 |
| FR-06 | UC-02 | — |
| FR-07 | UC-02 | — |
| FR-08 | UC-02 | — |
| FR-09 | UC-10 | BR-20 |
| FR-10 | UC-02, UC-10 | — |
| FR-11 | UC-01, UC-10 | BR-06, BR-07, BR-20 |
| FR-12 | UC-01, UC-03, UC-04, UC-10 | BR-18 |
| FR-13 | UC-01, UC-03 | BR-19 |
| FR-14 | UC-03, UC-10 | BR-05, BR-06, BR-07, BR-18, BR-21 |
| FR-15 | UC-03 | BR-07 |
| FR-16 | UC-05 | BR-09 |
| FR-17 | UC-06 | BR-12 |
| FR-18 | UC-06 | BR-09, BR-12 |
| FR-19 | UC-06 | BR-09, BR-12 |
| FR-20 | UC-05 | BR-06 |
| FR-21 | UC-05, UC-06 | BR-08 |
| FR-22 | UC-05, UC-06 | BR-09 |
| FR-23 | UC-05 | BR-10 |
| FR-24 | UC-05, UC-06, UC-07 | BR-12, BR-15, BR-17 |
| FR-25 | UC-07 | BR-12 |
| FR-26 | UC-05, UC-06, UC-07 | BR-12 |
| FR-27 | UC-08 | BR-01, BR-07 |
| FR-28 | UC-08 | BR-01 |
| FR-29 | UC-01, UC-09 | BR-04 |
| FR-30 | UC-01, UC-08 | BR-05 |
| FR-31 | Later (D-28) | BR-04, BR-05 |
| FR-32 | UC-01 | BR-16 |
| FR-33 | UC-04 | BR-02, BR-13, BR-18 |
| FR-34 | UC-05 | — |
| FR-35 | UC-09 | — |
| FR-36 | UC-01, UC-02, UC-10 | BR-02, BR-21 |
| FR-37 | UC-03 | BR-07 |
| FR-38 | UC-09 | BR-04 |
| FR-39 | UC-09 | BR-02, BR-06, BR-10, BR-21 |
| FR-40 | UC-09 | BR-04 |
| FR-41 | UC-01, UC-02 | — |
| FR-42 | UC-03, UC-05 | BR-11 |
| FR-43 | UC-03, UC-05 | BR-08 |
| FR-44 | UC-05 | BR-08, BR-09 |
| FR-45 | UC-05 | BR-18 |

BR-03 governs the external scraper. BR-14 applies later.
