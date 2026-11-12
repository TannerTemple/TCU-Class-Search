// Pure helpers for course cards, credit hours, and the day and start-time
// filters. No DOM, so they run under node --test (tests/js/courses.test.mjs).
import { sectionsConflict } from "./conflicts.js";

export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Splits Python's "Mon, Wed, Fri · 9:00–9:50 AM" (D-20) into its days and hours
// for layout only, so a line can break between them and nowhere else.
export function meetingParts(text) {
  const at = text.indexOf(" · ");
  return at === -1 ? [text, ""] : [text.slice(0, at), text.slice(at + 3)];
}

// Fills an element with one line per meeting: days, then hours.
export function appendMeetingLines(element, meetings) {
  for (const meeting of meetings) {
    const [days, hours] = meetingParts(meeting.text);
    const line = document.createElement("span");
    line.className = "meeting-line";
    const daysEl = document.createElement("span");
    daysEl.className = "meeting-days";
    daysEl.textContent = hours ? `${days} · ` : days;
    line.append(daysEl);
    if (hours) {
      const hoursEl = document.createElement("span");
      hoursEl.className = "meeting-hours";
      hoursEl.textContent = hours;
      line.append(" ", hoursEl);
    }
    element.append(line);
  }
}

// D-41: the last digit of the 5-digit catalog number is the credit hours
// (docs/06-data-dictionary.md). A final 0 marks a variable-credit course such
// as an internship or directed study, so it returns null and no badge shows
// (BR-18).
export function creditHours(catalogNbr) {
  if (!/^\d{5}$/.test(String(catalogNbr || ""))) return null;
  const digit = Number(String(catalogNbr).slice(-1));
  return digit > 0 ? digit : null;
}

// One card per course. A course code can carry several topic titles ("Special
// Problems - Ceramics"), and those are different classes, so the key includes
// the title. Order follows the sections' order.
export function courseKey(section) {
  return `${section.course_code}|${section.title}`;
}

export function groupCourses(sections) {
  const groups = new Map();
  for (const section of sections) {
    const key = courseKey(section);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        course_code: section.course_code,
        catalog_nbr: section.catalog_nbr,
        title: section.title,
        core_codes: new Set(),
        sections: [],
      };
      groups.set(key, group);
    }
    for (const code of section.core_codes || []) group.core_codes.add(code);
    group.sections.push(section);
  }
  return [...groups.values()].map((group) => ({ ...group, core_codes: [...group.core_codes] }));
}

// FR-03: "any" (the default) matches a section that meets on at least one
// selected day, so Tue lists Tue/Thu classes. "only" matches a section whose
// every meeting day is selected. Either way, a section with no set time
// doesn't match.
export function matchesDays(section, days, mode = "any") {
  if (days.size === 0) return true;
  const meetings = section.meetings || [];
  if (meetings.length === 0) return false;
  if (mode === "only") return meetings.every((m) => m.days.every((d) => days.has(d)));
  return meetings.some((m) => m.days.some((d) => days.has(d)));
}

// FR-09: "any" (the default) matches a section with at least one selected
// Core code; "all" needs every selected code, e.g. CA and GA together.
export function matchesCore(section, codes, mode = "any") {
  if (codes.size === 0) return true;
  const own = new Set(section.core_codes || []);
  const selected = [...codes];
  return mode === "all" ? selected.every((c) => own.has(c)) : selected.some((c) => own.has(c));
}

// FR-04: the start-time chips. Bounds are 24-hour "HH:MM", start inclusive and
// end exclusive.
export const START_BANDS = [
  ["morning", "Morning", "00:00", "12:00"],
  ["afternoon", "Afternoon", "12:00", "17:00"],
  ["evening", "Evening", "17:00", "24:00"],
];

// bands: a Set of band ids. range: { from, to } with either side null for
// open-ended, both inclusive. Matches when any meeting starts in a selected
// band (or the range); a section with no set time doesn't match.
export function matchesStart(section, bands, range) {
  const hasBands = bands && bands.size > 0;
  const hasRange = range && (range.from || range.to);
  if (!hasBands && !hasRange) return true;
  return (section.meetings || []).some((m) => {
    const start = m.start_time;
    if (hasRange) {
      return (!range.from || start >= range.from) && (!range.to || start <= range.to);
    }
    return START_BANDS.some(([id, , from, to]) => bands.has(id) && start >= from && start < to);
  });
}

// What a result row's button does, given the schedule: entries are
// [{ section, hidden }].
// - "added": this section is on the schedule.
// - "switch": another section of the same course and component is; the button
//   swaps it for this one in place (FR-18). `replaces` is that section.
// - "add": neither.
// `conflicts` lists visible scheduled sections this one would clash with under
// BR-08, leaving out the one it would replace. A conflict is a warning, never a
// block (BR-09).
export function sectionAction(section, entries) {
  if (entries.some((e) => e.section.class_nbr === section.class_nbr)) {
    return { kind: "added", replaces: null, conflicts: [] };
  }
  const sibling = entries.find(
    (e) =>
      courseKey(e.section) === courseKey(section) &&
      e.section.component_type === section.component_type,
  );
  const replaces = sibling ? sibling.section : null;
  const conflicts = entries
    .filter((e) => !e.hidden && e.section !== replaces && sectionsConflict(section, e.section))
    .map((e) => e.section);
  return { kind: replaces ? "switch" : "add", replaces, conflicts };
}

// The schedule header's total: each course counts once, however many of its
// sections (lecture, lab, backups) are scheduled, and hidden backups don't
// count. Variable-credit courses can't be summed, so they're counted apart.
export function totalCredits(entries) {
  const seen = new Set();
  let hours = 0;
  let variable = 0;
  for (const { section, hidden } of entries) {
    if (hidden) continue;
    const key = courseKey(section);
    if (seen.has(key)) continue;
    seen.add(key);
    const credits = creditHours(section.catalog_nbr);
    if (credits === null) variable += 1;
    else hours += credits;
  }
  return { hours, variable };
}

export function creditsText({ hours, variable }) {
  const base = `${hours} credit hour${hours === 1 ? "" : "s"}`;
  return variable > 0 ? `${base} + variable` : base;
}
