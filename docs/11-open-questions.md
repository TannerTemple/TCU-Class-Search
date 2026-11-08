# Open questions

Last updated: 2026-11-08, after the team's open-questions review (recording: "Texas Christian University 3", 12:46).

**For Claude Code:** Answers below come from Elliott and Tanner on that recording. Treat them as decisions.
1. Apply each answer to the docs it affects (decisions log, business rules, requirements, data dictionary, UI spec, deployment) and add new D-xx entries where an answer is a decision.
2. Items marked **Open** stay open. Don't resolve them yourself.
3. Where a row says "Claude research", it's background added outside the recording. Use it, but keep it marked unconfirmed until the team checks.
4. Don't invent names, class numbers, or URLs.

## Summary

| # | Question | Owner | Blocks | Status |
|---|---|---|---|---|
| OQ-01 | Exact JSON key names and formats | Team | Data dictionary | **Closed.** See the data dictionary |
| OQ-02 | Session end dates in the data, or derived? | Team | BR-08 | **Closed.** No end dates; derive them from session codes (D-21) |
| OQ-03 | Does the data link lectures to labs/recitations? | Team | BR-11 | **Closed.** No link; components are added separately |
| OQ-04 | Showcase classes and instructors; who verifies RMP links | Team | UC-04 | **Closed.** Three professors entered with RMP links (D-34) |
| OQ-05 | Success targets | Team | Vision | **Closed.** About 10 students using the site and giving feedback |
| OQ-06 | Request classify.tcu.edu from TCU IT after launch? | Team | Deployment | **Closed.** Yes, after launch |
| OQ-07 | License | Team | README | **Open.** Team undecided; use the default below until then |
| OQ-08 | Azure App Service tier for registration week | Team | Deployment | **Closed.** Student tier on the $100 Azure for Students credit |
| OQ-09 | Anonymous analytics: MVP or later? Which tool? | Team | BR-17 | **Open.** Not in the MVP; revisit later |
| OQ-10 | One row per class number: did the scraper drop extra meeting patterns? | Team | FR-21, FR-39 | **Closed.** Very likely for 13 math sections. Lectures and labs stay separate (D-32, D-33). Follow-up is OQ-24 |
| OQ-11 | `note` only ever says "Note" | Team | FR-14 | **Closed.** Broken on TCU's live site too. Always treat as empty |
| OQ-12 | Actual scrape time | Team | BR-04 | **Closed.** Use the commit time for now; record the scrape time in the next scrape |
| OQ-13 | Full names of 4W1, 4W2, 4W3, 4WK | Team | UI | **Partly answered by Claude research.** 4WK still open |
| OQ-14 | Meaning of component codes | Team | UI | **Provisional.** Revisit after the main site is built. `STA`, `LCL`, and `PER` show raw codes (D-25) |
| OQ-15 | Does a lone S mean Saturday? | Team | FR-39 | **Closed.** S = Saturday, and SA = Saturday |
| OQ-16 | FTDM 50970 (35782): "12:00–13:00" in days, empty time | Team | FR-39 | **Closed.** Data issue; it meets Tuesdays, 12:00–1:00 PM |
| OQ-17 | Course level labels | Team | FR-08 | **Closed.** Use the three bands from TCU's search form |
| OQ-18 | Show `syllabus_url`? | Team | BR-19 | **Closed.** The links go to TCU's course description page, not syllabi; show as "Course description" |
| OQ-19 | Should "Copy class numbers" include hidden backups? | Team | FR-27 | **Closed.** Copy one class at a time until a TCU database is available (D-31) |
| OQ-20 | Data age for the stale warning | Team | FR-31 | **Closed.** No stale warning in the MVP; data stays static |
| OQ-21 | ADM vs ACCT as the first subject | Team | D-07 | **Closed.** ACCT is correct; ADM was only an example |
| OQ-22 | Keep or remove the empty `requirements/` folder? | Team | — | **Closed.** Delete it |
| OQ-23 | Python versions on App Service | Team | Deployment | **Open.** The command failed on an expired Azure login; re-run it after logging in |
| OQ-24 | Fix the scraper to write one row per meeting, then rescrape | Team | FR-21, FR-43 | **Open.** Do before launch if possible |

## Answer details

### OQ-04 — Showcase classes and instructors
- **Answer:** The showcase is:
  - **Michael Scherger:** COSC 40203 Operating Systems, section 035, class 31705, the only section.
  - **James Huffman:** ENGR 30543 Engineering Electromagnetics, section 010, class 31172, the only section.
  - **Dr. Gong:** ENGR 10213 A & D Circuit. Entered for all three sections: 35616, 35617, and 35618.
- **Who verifies:** The team enters and checks the Rate My Professor URL by hand.
- **Later:** Get instructor data for every class automatically, so nothing is entered by hand.

### OQ-05 — Success targets
- **Answer:** The best case for the MVP is about **10 students** using the site. Classify is a website, not an app download.
- **The goal is feedback.** We want to hear what people like and don't like before we approach anyone at TCU.
- **People to approach after that:**
  - the Registrar
  - leadership in the Computer Science department (names were unclear on the recording; the team will fill them in)
  - a contact the team knows at TCU (unclear on the recording)
- **Decision:** No feedback link in the app. The team gathers feedback by hand (D-35).

### OQ-06 — Domain
- **Answer:** After launch, the team will work with TCU to get `classify.tcu.edu`. Alternatively, Classify could take over `classes.tcu.edu` itself.
- **Until then:** use the Azure default URL.

### OQ-07 — License (Open)
- **Team answer:** We don't know yet. Keep this open, and if one is needed, follow best practice.
- **Default until the team decides:** don't add an open-source license file. In the README, write "Copyright 2026 Elliott Miles and Tanner Temple. All rights reserved. License TBD."
  - **Why:** the team may sell Classify to TCU. Publishing under MIT would let anyone copy and reuse the code. A permissive license can still be chosen later.
  - **Note:** if the GitHub repo is public, people can see the code but still have no right to reuse it.

### OQ-08 — Azure tier
- **Answer:** Use the student offer: the $100 Azure for Students credit.
- **Why it's enough:** traffic will be low at first, because Classify isn't connected to TCU's real system yet.
- **Docs impact:** In the deployment doc, use the cheapest App Service tier that runs this app within the student credit. Start on the free tier if it works. Keep pricing marked "check current pricing".

### OQ-09 — Anonymous analytics (Open)
- **Answer:** Not in the MVP. Revisit later.
- **What it means** (the team asked): counting things like page visits and how many people click "Add to schedule", without knowing who anyone is. No names, emails, or student IDs. Examples are Azure Application Insights, which comes with Azure, and privacy-focused tools such as Plausible.
- **This matters later:** usage numbers are the pitch to TCU (D-02).

### OQ-10 — Extra meeting patterns (Closed)
- **Team discussion:** One course has several sections, each with its own class number and the same title, and labs usually have section numbers starting with 1. The data confirms this.
- **Team direction:** Read all the data and choose the best practice.
- **Lectures and labs:** Keep them separate, with a hint linking them (D-32). The data has no pairing, and each needs its own class number.
- **Dropped meetings:** Very likely for 13 math sections, based on credit hours against weekly minutes in both terms. The loader will merge rows by class number, and those sections show a note until a rescrape (D-33, OQ-24).
- **Details:** See the [data dictionary](06-data-dictionary.md#lectures-and-labs).

### OQ-11 — `note` field
- **Answer:** The note is broken on TCU's live site too; it's always empty.
- **Rule:** Always treat `note` as empty and never display it.

### OQ-12 — Scrape time
- **Answer:** Use the commit time as `scraped_at` for now (D-18). The next scrape will record its actual time.
- **Long-term:** Data will update live from TCU's back end. That would also allow showing how many students are enrolled and whether a class is full.
- **Docs impact:** Add both to the roadmap's "Later" section.

### OQ-13 — Session names
- **Team answer:** We're not sure. Keep it open and revisit.
- **Claude research:** The session dropdown on classes.tcu.edu, as seen Nov 8, 2026, lists these names. They are from TCU's own form; use them.

  | Code | Name |
  |---|---|
  | 4W1 | 1st 4 Week |
  | 4W2 | 2nd 4 Week |
  | 4W3 | 3rd 4 Week |
  | 4W4 | 4th 4 Week |
  | 3WK | Three Week |

- **Still open:** 4WK is not in the current dropdown. Show the raw code until the team confirms it. "Four Week" is a guess based on 3WK = "Three Week".

### OQ-14 — Component codes (Provisional)
- **Team answer:** If we don't know, use the most likely meanings for now, and handle edge cases once the main site is built.
- **Raw codes for now (D-25):** `STA` includes study-abroad-style classes, `LCL` often has separate labs, and `PER` covers more than performance.
- **Meanings to use:** these are common PeopleSoft Campus Solutions meanings, not confirmed for TCU. In the UI, show the label, and keep the raw code visible or available in a tooltip.

  | Code | Probable meaning | Confidence |
  |---|---|---|
  | LEC | Lecture | High |
  | LAB | Laboratory | High |
  | DIS | Discussion | High |
  | SEM | Seminar | High |
  | CLN | Clinical | High |
  | PRA | Practicum | High |
  | INT | Internship | High |
  | RES | Research | Medium |
  | DIR | Directed Study | Medium |
  | ACT | Activity | Medium |
  | STU | Studio | Medium |
  | IND | Independent Study | Medium |
  | WEB | Web / Online | Medium |
  | STA | Student Teaching | Medium |
  | EXP | Experiential / Field Experience | Low |
  | PER | Performance / Private Lesson (likely music) | Low |
  | LCL | Lecture–Lab Combined | Low |

- **Any other code:** show it raw.
- **Status:** stays provisional until the team confirms with TCU's registrar documentation.

### OQ-15 — Saturday codes
- **Answer:** S = Saturday, confirmed by the team for FINA 40533 and FINA 70583 (9:00 AM–1:00 PM). SA = Saturday too. SU = Sunday.
- **Parser rule:** map both S and SA to Saturday.

### OQ-16 — FTDM 50970 (class 35782)
- **Answer:** It's a data issue: "12:00–13:00" is a time, not days. The team says the class meets **Tuesdays, 12:00–1:00 PM, once a week**.
- **Fix:** Add a small data override for class 35782 (day: Tue; time: 12:00–13:00), with a comment citing this answer. Don't edit the scraped JSON.
- **Also:** Flag that the scraper should handle this case next time.

### OQ-17 — Course levels
- **Answer:** Use the three bands that TCU's search form and the Purple Schedule Builder use:
  - 10000–29999
  - 30000–49999
  - 50000 and up
- **Labels:** Show the bands exactly like that. Friendlier labels (for example, lower-level undergraduate, upper-level undergraduate, graduate) would be a guess, so only add them if the team confirms.
- **Screenshots:** The team will put screenshots in `docs/assets/`. Check them.

### OQ-18 — `syllabus_url`
- **Answer:** The links don't lead to syllabi; they go to TCU's course description page.
- **MVP:** Keep the link and show it in the pop-up as "Course description (TCU) ↗". Never call it a syllabus.
- **Later:** Bring that information into Classify's own course detail view: the course description, the instructor's name and photo, and more about the class. Add this to the roadmap.

### OQ-19 — Copy class numbers (Closed)
- **Answer:** Copy one class at a time until a TCU database is available (D-31). Each scheduled class has its own copy button, so hidden backups are no longer a question.

### OQ-20 — Stale data warning
- **Answer:** Don't worry about it now.
- **Plan:** Build the site around the current static data, stale or not. Once the site is built and the team is happy with it, get real data and add live updates.
- **Docs impact:**
  - Remove the stale warning from the MVP and move FR-31 to "Later".
  - Keep the "Class data as of …" timestamp (BR-04).

### OQ-21 — First subject
- **Answer:** Starting with ACCT is correct. ADM was only an example. No subject is missing on that account.

### OQ-22 — Empty `requirements/` folder
- **Answer:** Delete it. Dependencies live in `requirements.txt`.

### OQ-23 — Python versions on App Service (Open)
- **What happened:** `az webapp list-runtimes` didn't return runtimes. The Azure CLI login had expired, because the refresh token was inactive for 90 days.
- **Next steps (team):**
  1. Run `az login`.
  2. Run `az webapp list-runtimes --os linux -o table`.
  3. Paste the Python versions here.
- **Note:** the CLI warns that this command's output format changes in Azure CLI 2.86.0. Use `-o table` to read it, or `-o json` for scripts.
- **Until then:** target Python 3.12.