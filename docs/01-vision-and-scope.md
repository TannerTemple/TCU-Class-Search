# Vision and scope

## Product

**Classify** (working name, D-14) lets students search every TCU class in a clean, fast UI and add classes straight onto a weekly schedule, with no jumping between Class Search, the Purple Schedule Builder, and Rate My Professor.

> Unofficial student project. Not affiliated with or endorsed by Texas Christian University.

**Vision:** A TCU student finds classes and builds their own weekly schedule on one fast, clean page, without switching between Class Search, the Purple Schedule Builder, and RMP. Then they register in my.tcu.edu.

**Team:** Elliott Miles and Tanner Temple, TCU students. Both own the scraper, front end, back end, and outreach.

**Status:** MVP. The target is to have the MVP built on Nov 8, 2026. TCU's first undergraduate registration round for Spring 2027 is Thursday, Nov 12, 2026. There is no hard launch date.

## What it is

A student opens Classify and gets a cleaner class search. Empty fields aren't shown, it isn't blocky, it flows better, it's fast, and it works just like classes.tcu.edu. The difference is that they can add classes straight from the search onto a schedule.

Today students go back and forth between Class Search and the Purple Schedule Builder (the schedule tool inside my.tcu.edu). Classify combines those two. Later it adds Rate My Professor directly.

## What it is not

- Not a schedule recommender. The student builds their own schedule.
- Not a registration system. It never enrolls, registers, or drops anyone (BR-01).
- Not a degree audit, and it doesn't use student records.

## Background

- TCU's class search is at classes.tcu.edu (public, backed by PeopleSoft). Searching by instructor and seeing class location require a TCU login.
- Registration happens in my.tcu.edu. "Manage Classes" offers three ways to enroll: Purple Schedule Builder, Add Classes, and Shopping Cart. Students enroll with the 5-digit class number.
- Inspiration: UT Registration Plus, a student-built Chrome extension at UT Austin with 60,000+ users, and Stanford's Carta, a student-built course planner that the university later supported with data.
- Strategy (D-02): students first, TCU second. A later sale or adoption means a TCU security review (other schools take 45+ days), plus a VPAT (accessibility) and a HECVAT (security questionnaire). That's why accessibility and security matter even in the MVP.

## Problems with today's class search

1. Days and times are text in military time, so students cross-check their own calendar.
2. There's no way to add a class to a schedule and see it on a calendar from the search.
3. Reloading the page wipes everything; there's no autosave.
4. The Course Materials button is useless; instructors rarely post anything.
5. Clicking a class opens a new page instead of a pop-up.
6. Some number links (database IDs) do nothing when clicked.
7. The class number column clutters results; students think in course numbers (e.g., ECON 10223).
8. Students juggle two or three extra tabs: the Purple Schedule Builder and Rate My Professor.
9. Empty fields still take up space; the layout is blocky.

## Users

| User | Need | MVP? |
|---|---|---|
| Undergraduate student registering for next term | Find classes fast; add them to a weekly calendar; see conflicts | Yes, primary |
| First-year student | Read times and sections without decoding them | Yes |
| Team admin (Elliott, Tanner) | Replace the term data file and redeploy | Yes, internal |
| Advisors | See a student's planned schedule | Later |
| TCU Registrar / IT | An official data feed, endorsement, and eventually adoption | Later (pitch after launch) |

## In scope (MVP)

- Search and filter all Spring 2027 classes (D-16) by subject, course number, title keyword, days, start time, status (Open/Closed, D-17), session, instruction mode, course level, and Core curriculum code (D-15).
- Clean result rows. Each row shows the course code and title first, 12-hour times, and day names. Empty fields are not shown. There is no class number column, no Course Materials button, and no dead links.
- A course detail pop-up (not a new page) that shows every non-empty field, including the class number with a copy button.
- Add to schedule straight from search, onto a weekly calendar. Conflicts are flagged.
- Remove, swap, and show/hide sections on the calendar.
- Autosave in the browser. A reload keeps the schedule.
- Hand-off: a copy button for each scheduled class number, plus a link to my.tcu.edu (D-31).
- RMP link-out for the hand-entered showcase instructors only.
- A data timestamp on every data screen ("Class data as of …").
- Works on phones.
- An "Unofficial student project" footer.

## Out of scope (MVP)

- Registration or enrollment of any kind.
- Login, TCU SSO, and student records.
- Live seat counts.
- The "what I still need" checklist, recommended schedules, and degree audit.
- RMP ratings shown in the app, course scores, and grade distributions.
- Instructor photos and the full instructor list.
- Sharing schedules between users.
- A Fall 2026 term toggle (D-16).
- A stale data warning (D-28).
- An in-app feedback link (D-35).
- Intramurals, events, transfer credit, and room finders.

## Success measures

The best case for the MVP is about 10 students using the site (D-35). The goal is to hear what people like and don't like, gathered by hand, before the team approaches anyone at TCU.
