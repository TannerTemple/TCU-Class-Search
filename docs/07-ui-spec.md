# UI spec

## Layout

### Desktop: one page

| Area | Content |
|---|---|
| Top | "Classify", "Spring 2027", and "Class data as of …" (FR-29) |
| Left | Filter rail and results list |
| Right | Weekly calendar |
| Bottom | Footer disclaimer (FR-32) |

### Mobile: two tabs

The tabs are **Search** and **My schedule** (FR-34). Add gives visible feedback: a toast and a badge count on the My schedule tab. The layout works down to 375 px (NFR-03).

| Element | Rule |
|---|---|
| Breakpoint | 768 px and narrower. Wider screens show both panels and no tabs |
| Tab bar | Sticks to the top under the header. Follows the WAI-ARIA tabs pattern: arrow keys, Home, and End move between tabs |
| Search tab | Filters and results. Filters start collapsed behind "Show filters" |
| My schedule tab | Calendar, Scheduled classes list, and the register link |
| Badge | Counts every scheduled class, including hidden and Unscheduled ones. Hidden at 0 (BR-18). Screen readers hear "My schedule, 2 classes" |
| Toast | "Added ECON 10223 section 010 to My schedule", for 3 seconds, at the bottom. Only on the Search tab, since My schedule shows the add itself. Announced to screen readers. Taps pass through it |
| Calendar blocks | Labels wrap ("ACCT 20353 · 002") instead of cutting off |
| Pop-up | A bottom sheet at full width |
| Touch targets | At least 40 px tall for Add, Copy, Hide, Remove, Swap, and filter controls |

## Result row

| Element | Rule |
|---|---|
| Course code and title | Bold, first |
| Section | Always |
| Component type | Provisional label, or the raw code (D-25) |
| Session | Only if not Regular |
| Days and time | "Mon, Wed, Fri · 9:00–9:50 AM". Omitted if there's no set time |
| Core codes | Small tags, only if present (BR-20) |
| Instruction mode | Only if not In Person (D-22) |
| Status chip | "Open as of Nov 8" or "Closed as of Nov 8" (BR-05, BR-21) |
| Add button | Toggles to "Added ✓" |

The row never shows the class number, Course Materials, or empty fields.

## Pop-up

Opens on the same page. Esc and an outside click close it. It traps focus while open and returns focus to the row afterward (NFR-04). Empty fields aren't rendered (BR-18).

| Label | Source |
|---|---|
| Course and title | `course_code`, `title` |
| Class number, with copy button | `class_nbr` |
| Section | `section` |
| Component | `component_label`, or `component_type` if there's no label |
| Session | `session_name`, or `session_code` if unnamed |
| Starts | `start_date`, as "Jan 19, 2027" |
| Meets | `meetings`, in 12-hour time |
| Instruction mode | `instruction_mode` |
| Core | `core_codes` |
| Status | "Closed as of Nov 8 · Department permit required" for permit sections |
| Seats | Enroll max, reserve max, wait max |
| Course description (TCU) ↗ | `course_description_url` (D-24) |
| Labs | "This course also lists 23 lab sections", when it does (FR-42) |
| Times note | "Meeting times may be incomplete. Check classes.tcu.edu.", when flagged (FR-43) |
| Instructor and "Rate My Professor ↗" | Showcase classes only (FR-33) |
| Add or Remove | Current schedule state |

## Calendar

- Colored blocks show the course code, time, and section.
- The grid is Mon–Fri, 8 AM–10 PM by default. It expands when needed (FR-20). Three Spring sections fall outside the default hours.
- Conflicts get a red outline and a banner naming the clashing classes (FR-22). Color is not the only signal; the banner names them too.
- Hidden backups appear in gray and can be toggled (FR-19).
- An "Unscheduled" list sits under the grid (FR-23).
- Each scheduled class has a copy button for its class number (D-31).
- The top action is "Register in my.tcu.edu ↗".

## States

| State | Behavior |
|---|---|
| Loading | Light placeholder in the results area, announced to screen readers |
| No results | Message and a clear-filters action |
| Empty schedule | Hint: add a class from search |
| Storage unavailable | Warning that the schedule won't be saved (FR-26) |
| Data load error | Message in place of the list, with a retry |

## Accessibility (NFR-04)

Target: WCAG 2.1 AA.

- Keyboard: every control is reachable. A skip link jumps past the filters to the search box.
- Focus: one visible focus ring everywhere. Add, Remove, Hide, and Swap keep focus in place; when a removed row's controls are gone, focus moves to the "Scheduled classes" heading. "Added ✓" uses `aria-disabled`, not `disabled`, so the pressed button keeps focus.
- Names: each Add, Copy, Hide, and Remove button names its class, e.g. "Add ECON 10223 section 010". The name starts with the visible text.
- Pop-up: traps focus, closes on Esc, returns focus to the row, and makes the rest of the page `inert` while open.
- Color: text is at least 4.5:1 and control borders at least 3:1. Hidden backups use a gray fill and a dashed border, not transparency. Conflicts also show a "Conflict" chip and the banner, not only a red outline.

## Visual direction

Clean, not blocky, with generous spacing. A neutral palette with one purple accent, a nod to TCU without using TCU logos or official marks (BR-16). System fonts.

## Current site vs Classify

Based on team screenshots of classes.tcu.edu from Nov 8, 2026:

![Search results on classes.tcu.edu](assets/Screenshot%202026-11-08%20at%203.00.09%E2%80%AFPM.png)

![Search form on classes.tcu.edu](assets/Screenshot%202026-11-08%20at%201.54.11%E2%80%AFPM.png)

| Topic | classes.tcu.edu today | Classify |
|---|---|---|
| Layout | Dense, 15-column gray table | Clean rows with only what matters |
| Search | A form, then a results page | Instant results while typing (FR-01) |
| Result limit | "572 matching class meetings (only first 500 shown)" | All matches are reachable (FR-11) |
| Times | "9:00-10:50", with afternoon times in 24-hour form in the data | "9:00–10:50 AM" (BR-06) |
| Days | "MWF" and "TR" | "Mon, Wed, Fri" (BR-06) |
| Class number | First column, with the instruction "click on the Class Nbr" | Pop-up and copy only (BR-07) |
| Course details | Link opens another page | Same-page pop-up (FR-14) |
| Empty columns | "Note", "Core Code", and "Rsv Max" stay when blank | Not rendered (BR-18) |
| Seats | Stacked numbers under "Enr Max" and "Wait Max" | Labeled maximums in the pop-up |
| Course materials | A book icon on every row | Removed (BR-19) |
| Core | 14 checkboxes on the search form | Filter and tags (BR-20) |
| Location filter | Dropdown on the form | Not in the MVP. Location data needs a login (BR-02) |
| Class Attribute filter | Dropdown on the form | Not in the MVP. Not in the data |
| Instructor | "login to search by instructor / see class location" | Showcase classes only (D-12) |
| Schedule | Separate Schedule Builder button | Add from search, on one page (FR-16) |
| Reload | Loses everything | Autosaved (FR-24, FR-25) |
| Branding | TCU logo and banner | No TCU marks, plus a disclaimer (BR-16) |
