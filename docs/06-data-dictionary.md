# Data dictionary

## Source

Data comes from the classes.tcu.edu public search results. It is scraped by subject and committed to the repo as JSON, once per term (D-07, D-08). The scraper is not in this repo.

| File | Used by the app? | Size | Records | Term |
|---|---|---|---|---|
| `data/tcu_classes_spring27.json` | Yes | 3.14 MB | 3,926 | `4273`, "27 Spring" |
| `data/tcu_classes_fall26.json` | No (D-16) | 2.97 MB | 3,704 | `4267`, "26 Fall" |
| `data/term_meta.json` | Yes (D-18) | — | — | Holds `term_code`, `scraped_at`, `source` |
| `data/instructors_showcase.json` | Later (FR-33) | — | 5 | Hand-entered showcase instructors |
| `data/overrides.json` | Later (FR-39, FR-43) | — | — | Hand-entered corrections to the scraped data |

Both class files share the same 25 keys. Every record has all of them.

## Field reference

Empty means `null`, `""`, or `[]`. Percentages and examples are from Spring 2027. Zero is a value, not empty.

| Raw JSON key | Meaning | Example values | % empty | How it's displayed in Classify | Notes |
|---|---|---|---|---|---|
| `term_code` | PeopleSoft term code | `4273` | 0 | Not displayed | One value per file |
| `term_name` | Term label | `27 Spring` | 0 | Header, as "Spring 2027" | |
| `class_nbr` | 5-digit class number, used to enroll | `34429`, `34430`, `30646` | 0 | Pop-up and copy hand-off only (BR-07) | Unique in both files |
| `subject` | Subject code | `ACCT`, `ADRN`, `AEST` | 0 | Part of course code; filter | 123 subjects |
| `catalog_nbr` | Catalog number | `20353`, `20653`, `30153` | 0 | Part of course code; first digit is the level filter | Always 5 digits |
| `course` | Subject and catalog number | `ACCT 20353`, `ACCT 20653`, `ACCT 30153` | 0 | Main ID, bold (BR-07) | Always equals `subject` + space + `catalog_nbr` |
| `section` | Section number | `002`, `010`, `020` | 0 | Result row and pop-up | Keep as text |
| `session` | Session code | `REG`, `8W1`, `8W2` | 0 | Row only if not REG; pop-up | Also `4W1`, `4W2`. Fall adds `4W3`, `4WK` (OQ-13) |
| `type` | Component type | `LEC`, `INT`, `PRA` | 0 | Provisional label, with raw code available; `STA`, `LCL`, and `PER` raw (D-25) | 15 Spring codes (OQ-14). Not in the team's field list |
| `core_codes` | Core curriculum codes | `[WEM]`, `[CSV]`, `[CA, SSC]` | 72.4 | Row, pop-up, and filter (BR-20) | 14 codes, listed below |
| `note` | Note flag | `Note` | 95.8 | Never displayed (D-27) | Only ever the literal word "Note" (OQ-11) |
| `title` | Title or topic | `Fundamentals of Accounting`, `Introduction to Accounting`, `Financial Reporting I` | 0 | Bold in row and pop-up | Up to 63 characters |
| `start_date` | Start date, MM/DD/YY | `01/19/27`, `03/22/27`, `02/15/27` | 0 | Pop-up as "Jan 19, 2027" | Same for all rows in a session |
| `instruction_mode` | Delivery mode | `In Person`, `Online Only` | 0 | Row if not In Person (D-22); pop-up; filter | 3,785 and 141 rows |
| `days` | Day codes or TBA | `MWF`, `T`, `W` | 0 | Day names (BR-06) | 1,242 rows are `TBA`. See parsing rules |
| `time` | 24-hour range, `ARR`, or `:-:` | `8:00-8:50`, `9:00-9:50`, `10:00-10:50` | 0.03 | 12-hour time (BR-06) | No AM/PM in the data, and none is needed |
| `status` | Enrollment status | `Open`, `DeptPermit`, `InstrPermit` | 0 | Chip: Open or Closed (BR-21); permit detail in pop-up | 2,633 / 977 / 316 rows. No `Closed` in Spring; Fall has 1,266 |
| `enrolled` | Seats taken at scrape | `0` | 0 | Not displayed (D-23) | Always 0 in Spring. Not in the team's field list |
| `enr_max` | Enrollment limit | `30`, `40`, `36` | 0 | Pop-up | Bottom number in TCU's "Enr Max" column |
| `reserved` | Reserved seats taken | `0` | 99.6 | Not displayed (D-23) | Not in the team's field list |
| `rsv_max` | Reserve limit | `25`, `20`, `5` | 99.6 | Pop-up if present (BR-18) | |
| `waitlisted` | Waitlist count | `0` | 0 | Not displayed (D-23) | Always 0 in Spring. Not in the team's field list |
| `wait_max` | Waitlist limit | `0`, `10`, `5` | 0 | Pop-up | 2,726 rows are 0 |
| `syllabus_url` | Course description link, despite the key name | `https://classes.tcu.edu/showsyl.aspx?Syl=ACCT203530024273` | 0 | Pop-up as "Course description (TCU) ↗" (D-24) | Never call it a syllabus |
| `bookstore_url` | Bookstore link | `https://www.bkstr.com/webApp/discoverView?bookstore_id-1=1546&term_id-1=4273&…` | 0 | Never displayed (BR-19) | The Course Materials link |

**Confirmed absent:** instructor, room or location, course description, credit hours, end date, lecture-lab links, and a scrape timestamp. The fields the team expected are all present.

### Core codes

Names come from the classes.tcu.edu search form.

| Code | Name | Spring rows |
|---|---|---|
| CSV | Citizenship & Social Values | 101 |
| CA | Cultural Awareness | 142 |
| FAR | Fine Arts | 57 |
| GA | Global Awareness | 124 |
| HUM | Humanities | 135 |
| HT | Historical Traditions | 50 |
| LT | Literary Traditions | 54 |
| MTH | Mathematics | 57 |
| NSC | Natural Sciences | 160 |
| OCO | Oral Communication | 70 |
| RT | Religious Traditions | 37 |
| SSC | Social Sciences | 158 |
| WCO | Written Communication | 75 |
| WEM | Writing Emphasis | 295 |

A section can have more than one code, so these counts add up to more than 1,084.

## Normalized model

Defined in `app/models.py`.

### `Term`

| Field | Type | Source |
|---|---|---|
| `code` | text | `term_code`, e.g. `4273` |
| `name` | text | `term_name`, shown as `Spring 2027` |
| `scraped_at` | ISO timestamp | `data/term_meta.json` |
| `source` | text | `data/term_meta.json`, `classes.tcu.edu` |

### `Section`

| Field | Type | Source and rule |
|---|---|---|
| `class_nbr` | text | `class_nbr` |
| `subject` | text | `subject` |
| `catalog_nbr` | text | `catalog_nbr` |
| `course_code` | text | `course` |
| `title` | text | `title` |
| `section` | text | `section` |
| `session_code` | text | `session` |
| `session_name` | text or null | REG = Regular; 8W1/8W2 = 1st/2nd Eight Week; 4W1 to 4W4 = 1st to 4th 4 Week; 3WK = Three Week. Otherwise null, and the code shows, as for 4WK (OQ-13) |
| `component_type` | text | `type` |
| `component_label` | text or null | Provisional label from OQ-14. Null for `STA`, `LCL`, `PER`, and unknown codes, so the raw code shows (D-25) |
| `core_codes` | list | `core_codes` |
| `start_date` | date | `start_date` |
| `end_date` | date or null | D-21. An upper bound, for conflict checks only |
| `instruction_mode` | text | `instruction_mode` |
| `status` | Open or Closed | `Open` stays Open. All other values become Closed (BR-21) |
| `status_detail` | text | Raw `status` |
| `enroll_max` | integer or null | `enr_max` |
| `rsv_max` | integer or null | `rsv_max` |
| `wait_max` | integer or null | `wait_max` |
| `note` | text or null | Always null (D-27) |
| `course_description_url` | text | `syllabus_url` (D-24) |
| `meetings` | list of `Meeting` | Parsed from `days` and `time`. Empty means Unscheduled (BR-10) |
| `meetings_may_be_incomplete` | true or false | True if listed in `data/overrides.json` (FR-43) |
| `instructor_name` | text or null | Showcase file only (D-12) |
| `rmp_url` | text or null | Showcase file only (D-12) |

### `Meeting`

| Field | Type | Notes |
|---|---|---|
| `days` | list | `Mon` to `Sun` |
| `start_time` | text | 24-hour `HH:MM` internally, 12-hour on display |
| `end_time` | text | 24-hour `HH:MM` internally, 12-hour on display |

## Parsing rules

### Days

Read the code left to right, matching two-letter codes first.

| Code | Day |
|---|---|
| `M` | Mon |
| `T` | Tue |
| `W` | Wed |
| `R` | Thu |
| `F` | Fri |
| `SA` | Sat |
| `SU` | Sun |
| `S` (alone) | Sat (D-30) |
| `TBA` | No days |

Spring values: `TBA`, `TR`, `MWF`, `MW`, `W`, `M`, `T`, `R`, `F`, `MF`, `SA`, `WF`, `WR`, `S`, `MTR`, `TWRF`, `TRF`. `SU` doesn't appear in the current data, but the parser handles it.

### Times

| `time` value | Rows | Result |
|---|---|---|
| `H:MM-H:MM` or `HH:MM-HH:MM` | 2,647 | One `Meeting`. Pad to `HH:MM` and keep as 24-hour. `7:00` is 7 AM and `13:00` is 1 PM |
| `ARR` | 1,242 | No meetings; Unscheduled |
| `:-:` | 36 | No meetings; Unscheduled. All are nursing practicum rows with a day but no time |
| empty | 1 | Corrected by an override. See bad rows below |

### Online and TBA

Online isn't the same as unscheduled. Of 141 Online Only rows, 75 are TBA and 66 have set days and times. Rows with set times go on the calendar. Rows without go to the Unscheduled list (BR-10).

### Multiple meeting patterns

Each row has one days/time pair, and every class number appears once, so the current data produces zero or one meeting per section. A review of all rows (OQ-10) shows that some sections almost certainly lost a meeting:

- The last digit of a catalog number appears to be the credit hours, and 3-credit classes nearly always meet about 150 minutes a week.
- 13 Spring math sections worth 4 credits show only 50 to 110 minutes a week. Calculus I section 050 shows only Mondays, 1:00–1:50 PM. The same pattern appears in Fall.
- TCU's results page counts "class meetings", and a screenshot of what appears to be an MWF search shows 572 against 567 MWF rows here.

| Rule | Detail |
|---|---|
| Loader | Merge rows sharing a class number into one section with several meetings (D-33) |
| Scraper | Write one row per meeting (OQ-24) |
| Until the rescrape | `data/overrides.json` lists the 13 math sections, which show an "incomplete times" note (FR-43) |
| Never | Guess a missing meeting. Only the rescrape can supply it |

### Lectures and labs

One course can have many sections at different times. The row's `type`, not its section number, says what a section is.

| Finding (Spring 2027) | Count |
|---|---|
| Courses with LAB sections | 76 |
| Courses listing labs alongside another component under the same course code | 71 |
| LAB sections with a section number starting with 1 | 226 of 246 |
| Non-LAB sections with a section number starting with 1 | 169 (PRA, CLN, DIS) |
| Labs whose last two section digits match a lecture | 65 of 228 |

Section numbers hint at pairing but don't define it. BIOL 10003 has 4 lectures (010, 030, 035, 055) and 23 labs (101 and up), and nothing says which go together. A few courses also list one optional-looking lab beside many lectures, such as BUSI 30383 with 16 lectures and 1 lab.

**Rule (D-32, BR-11):** keep each lecture and lab as its own section with its own class number, on the calendar and in the hand-off. Merging would require guessing pairs, and my.tcu.edu needs each class number. To keep them connected, a section whose course lists labs says so and offers to show them (FR-42). Swap offers only the same component type (FR-18).

### Duplicates

Scraping by subject could repeat classes, but the current data has none: `class_nbr` is unique in both files.

| Case | Rule |
|---|---|
| Same `class_nbr`, all fields identical | Keep one |
| Same `class_nbr`, differing only in `days` and `time` | Merge into one section with several meetings |
| Same `class_nbr`, other fields differ | Validation warning for review |
| Different `class_nbr`, same title and time | Likely cross-listed, such as BIOL 50143 and CHEM 50143. Keep both |

### Bad rows

| Class number | Course | Problem | Handling |
|---|---|---|---|
| 35782 | FTDM 50970 | `days` holds `12:00-13:00`; `time` is empty | Corrected in `data/overrides.json` to Tuesdays, 12:00–1:00 PM (D-29). The scraper should handle this case next time |

## Showcase instructor file

`data/instructors_showcase.json` is hand-entered (D-12, D-34). An empty `rmp_url` shows the name without a link.

```json
[{"class_nbr": "00000", "instructor_name": "Placeholder Name", "rmp_url": "https://www.ratemyprofessors.com/placeholder"}]
```

The values above are fake and show the format only. Never look up or invent real names or URLs. The team supplies and verifies them (OQ-04).

## Data refresh runbook

Run the scraper off-peak and never during a registration rush (BR-03).

1. Put the new JSON in `data/`. For a new term, point `CLASSIFY_DATA_PATH` at it.
2. Update `data/term_meta.json`. Set `term_code` to match the file and `scraped_at` to the actual scrape time, as an ISO timestamp with a UTC offset.
3. Validate:
   ```sh
   python scripts/validate_data.py
   pytest
   ```
   Fix any failure. Review every warning.
4. Check the Core, status, and session values in the new file against this document. Update it if they changed.
5. Commit and redeploy. See [deployment](08-deployment-azure.md).
6. Open the site. Confirm the "Class data as of …" date and that `/api/meta` shows the new values.
