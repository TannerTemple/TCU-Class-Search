# Open questions

| # | Question | Owner | Blocks | Status |
|---|---|---|---|---|
| OQ-01 | Exact JSON key names and formats (confirm against data) | Team | Data dictionary | **Answered.** See the [data dictionary](06-data-dictionary.md) |
| OQ-02 | Does the data contain session end dates, or must they be derived from session codes? | Team | BR-08 | **Answered.** No end dates. D-21 proposes a derivation. A published session calendar would be more exact |
| OQ-03 | Does the data link lectures to labs/recitations? | Team | BR-11 | **Answered.** No link. Components are added separately |
| OQ-04 | Which showcase classes and instructors to hand-enter, and who verifies the RMP links | Team | UC-04 | Open |
| OQ-05 | Success targets (e.g., number of students who build a schedule before Nov 12) | Team | Vision | Open |
| OQ-06 | Domain: request `classify.tcu.edu` from TCU IT after launch? | Team | Deployment | Open |
| OQ-07 | License (MIT, all rights reserved, or other) | Team | README | Open |
| OQ-08 | Azure App Service tier for registration week | Team | Deployment | Open |
| OQ-09 | Anonymous analytics: add in MVP or after? Which tool? | Team | BR-17 | Open |
| OQ-10 | Every class number has exactly one row, but TCU's results count "class meetings." Did the scraper drop additional meeting patterns? | Team | FR-21, FR-39 | Open. Check against the scraper and the live site. A dropped meeting means missed conflicts |
| OQ-11 | `note` only ever contains the word "Note" (165 Spring rows). Can the scraper capture the real text? | Team | FR-14 | Open. Treated as empty for now |
| OQ-12 | What was the actual scrape time? `scraped_at` uses the commit time (D-18) | Team | BR-04 | Open |
| OQ-13 | What are the full names of 4W1 and 4W2, and of Fall's 4W3 and 4WK? | Team | UI | Open. Codes show until confirmed |
| OQ-14 | What do the component codes mean (LCL, PER, RES, DIR, PRA, CLN, ACT, INT, WEB, STA, DIS, EXP, and others)? | Team | UI | Open. Raw codes show until confirmed |
| OQ-15 | Does a lone `S` mean Saturday? Two rows, FINA 40533 and FINA 70583 at 9:00-13:00, use it; others use `SA` | Team | FR-39 | Open. Assumed Saturday |
| OQ-16 | FTDM 50970 (35782) has `12:00-13:00` in `days` and an empty `time`. Is this a scraper bug or TCU's data? | Team | FR-39 | Open. Listed as Unscheduled |
| OQ-17 | How should course levels be labeled? The search form's level options weren't visible in the screenshots | Team | FR-08 | Open. The filter uses the first catalog digit |
| OQ-18 | Should `syllabus_url` be shown? It is on every row, but it's unknown whether the links lead to real syllabi | Team | BR-19 | Open. Not displayed |
| OQ-19 | Should "Copy class numbers" include hidden backups? FR-27 copies all scheduled sections for now | Team | FR-27 | Open |
| OQ-20 | How old should the data be before the stale warning shows? Proposed: 14 days | Team | FR-31 | Open |
| OQ-21 | The brief says scraping began with ADM, but the data has no ADM subject and starts at ACCT. Is a subject missing? | Team | D-07 | Open |
| OQ-22 | Keep or remove the empty `requirements/` folder? It isn't tracked by git, and dependencies live in `requirements.txt` | Team | — | Open |
| OQ-23 | Which Python versions does App Service offer today? Run `az webapp list-runtimes` | Team | Deployment | Open. Targets 3.12 |
