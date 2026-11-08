# Business rules

These rules are binding. Requirements in [04-requirements.md](04-requirements.md) trace back to them.

| ID | Rule | Why | Status |
|---|---|---|---|
| BR-01 | The app never registers, enrolls, or drops a student. It ends with a hand-off to my.tcu.edu. | Only TCU's system can enroll | Confirmed |
| BR-02 | Use only data shown publicly on classes.tcu.edu. Never collect data from pages behind the TCU login. Exception: hand-entered instructors for a few showcase classes (D-12). | TCU gates instructor and location on purpose | Confirmed |
| BR-03 | The external scraper is polite: low request rate, off-peak hours, and never run during registration rushes. | Protect TCU's servers and goodwill | Confirmed |
| BR-04 | Every data screen shows when the data was scraped. | Status changes after the scrape | Confirmed. Timestamp source is D-18 |
| BR-05 | Open/closed status is labeled as a snapshot, never as live. | Live seats need TCU's data | Confirmed |
| BR-06 | Times show in 12-hour format with AM/PM; days show as names ("Mon, Wed, Fri"). | Military time is the top complaint | Confirmed |
| BR-07 | The course code (e.g., ECON 10223) is the main ID. The class number is hidden from results but shown in the pop-up and the copy hand-off. | Students think in course codes; my.tcu.edu enrolls by class number | Confirmed |
| BR-08 | Two sections conflict only when they share a day, their times overlap, and their date ranges overlap. If a date range can't be determined, assume it overlaps. | Different-half 8-week sessions don't clash | Confirmed. The data has start dates only; end dates follow D-21 |
| BR-09 | A conflict is a warning, not a block. Both sections stay on the calendar. | Students compare backups | Confirmed |
| BR-10 | Sections with no set meeting time (online, arranged, TBA) go in an "Unscheduled" list under the calendar. | Can't be placed on a grid | Confirmed |
| BR-11 | Linked components (lecture plus lab) are added together only if the data links them. | Students need both to register | The data has no link (OQ-03), so each component is added separately in the MVP |
| BR-12 | The schedule autosaves to the browser after every change. No account needed. | Reloading today wipes everything | Confirmed |
| BR-13 | Rate My Professor is a link-out only; the app doesn't copy RMP ratings or reviews. | RMP's terms | Confirmed |
| BR-14 | Instructor photos are not in the MVP. If added later, they come only from TCU's staff directory. | Don't pull people's photos from random sources | Confirmed (later) |
| BR-15 | Schedules are private. Any future sharing is opt-in and link-only, with no public directory of who's where. | Safety: knowing where someone is at a given time | Confirmed |
| BR-16 | The site says "Unofficial student project, not affiliated with TCU" and uses no TCU logos or marks. | Trademarks; don't look official before endorsement | Confirmed |
| BR-17 | No personal data is collected. At most, anonymous aggregate usage counts. | Keeps a later FERPA/security review simple | Confirmed |
| BR-18 | Fields with no value are not rendered: no empty columns, labels, or placeholders. | Team's main UI complaint | Confirmed |
| BR-19 | Remove the Course Materials button and any link that does nothing. | They're useless today | Confirmed |
| BR-20 | Core curriculum codes are shown and filterable in the MVP, using the scraped `core_codes` field. | The data includes them, and students start from the requirement they need (D-15) | Confirmed. Revised from "not in the MVP" |
| BR-21 | The status filter and chip offer only Open and Closed. Permit-required sections (`DeptPermit`, `InstrPermit`) count as Closed. The pop-up shows the permit detail. | Team choice (D-17) | Confirmed |
