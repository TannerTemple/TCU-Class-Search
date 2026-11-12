// FR-16, FR-17, FR-20, FR-23: add/remove sections onto a weekly grid that is
// always shown, even empty. Sections with no set time stay in the list as
// "No set time" (BR-10). FR-21, FR-22: BR-08 conflicts are warnings only
// (BR-09) — both sections stay, outlined, with a banner naming them. FR-18,
// FR-19: switch to another section of the same course and component in place
// (BR-11), and hide/show a backup (hidden ones are gray and don't count as
// conflicts). FR-24 to FR-26: autosaved via storage.js; restores on load, and
// warns if storage can't save (BR-12). FR-27: every scheduled class gets its
// own copy button (D-31). FR-44: a hovered result previews as a ghost block.
// NFR-04: a re-render keeps keyboard focus on the same control, or moves it to
// a heading when that control is gone, so focus never falls back to the page.
import { copyClassNumber } from "./clipboard.js";
import { sectionsConflict } from "./conflicts.js";
import {
  DAY_ORDER,
  appendMeetingLines,
  courseKey,
  creditsText,
  sectionAction,
  totalCredits,
} from "./courses.js";
import { storage } from "./storage.js";

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEFAULT_START_HOUR = 8; // FR-20
const DEFAULT_END_HOUR = 18;
const HOUR_HEIGHT_PX = 44;
const COLOR_COUNT = 6; // .course-color-0 to -5 in app.css.

const schedule = new Map(); // class_nbr -> { section, hidden }
const listeners = [];
let catalog = [];
let storageOk = true;
let restoreNotice = null;
let pendingFocusKey = null;
let grid = null; // { days, startHour, endHour, columns: Map(day -> element), note }

// Listeners get an event: { type: "add", section }, or { type: "remove" |
// "hide" | "swap" | "restore" }. FR-34 uses "add" for the mobile toast.
function notify(event) {
  for (const listener of listeners) listener(event);
}

function termCode() {
  return document.body?.dataset.termCode || "";
}

function persist() {
  const items = [...schedule.entries()].map(([classNbr, entry]) => ({
    class_nbr: classNbr,
    visible: !entry.hidden,
  }));
  storageOk = storage.save(termCode(), items);
}

export function isScheduled(classNbr) {
  return schedule.has(classNbr);
}

// The schedule as [{ section, hidden }], in the order the classes were added.
export function entries() {
  return [...schedule.values()];
}

// FR-16: "Add", "Added ✓", or "Switch" when another section of the course is
// scheduled (FR-18). NFR-04: aria-disabled, not disabled, so a button that was
// just pressed keeps keyboard focus. The accessible name starts with the
// visible text and names the class, since every row has its own button.
export function addButtonState(scheduled, label, kind = scheduled ? "added" : "add") {
  if (kind === "added") {
    return { text: "Added ✓", ariaLabel: `Added: ${label}`, ariaDisabled: "true" };
  }
  if (kind === "switch") {
    return { text: "Switch", ariaLabel: `Switch to ${label}`, ariaDisabled: "false" };
  }
  return { text: "Add", ariaLabel: `Add ${label}`, ariaDisabled: "false" };
}

// FR-34: the badge on the My schedule tab counts every scheduled section,
// including hidden and Unscheduled ones.
export function scheduledCount() {
  return schedule.size;
}

export function onChange(listener) {
  listeners.push(listener);
}

export function setCatalog(sections) {
  catalog = sections;
}

export function getCatalog() {
  return catalog;
}

// FR-18, BR-11: another section of the same course and component, not this one.
// Topic courses share a course code across titles, so the title must match too.
export function findAlternates(section, sections) {
  return sections.filter(
    (s) =>
      s.course_code === section.course_code &&
      s.title === section.title &&
      s.component_type === section.component_type &&
      s.class_nbr !== section.class_nbr,
  );
}

// FR-42: the lab sections a course lists, besides this one.
export function findLabs(section, sections) {
  return sections.filter(
    (s) =>
      s.course_code === section.course_code &&
      s.component_type === "LAB" &&
      s.class_nbr !== section.class_nbr,
  );
}

// FR-16: one entry per class number; adding an already-scheduled section does nothing.
export function addSection(section) {
  if (schedule.has(section.class_nbr)) return;
  schedule.set(section.class_nbr, { section, hidden: false });
  persist();
  render();
  notify({ type: "add", section });
}

// FR-17: leaves the calendar; the caller's own row listens via onChange to flip
// its Add button back.
export function removeSection(classNbr) {
  if (!schedule.delete(classNbr)) return;
  persist();
  render();
  notify({ type: "remove" });
}

// FR-19: toggles a scheduled section gray; hidden sections don't count as conflicts.
export function toggleHidden(classNbr) {
  const entry = schedule.get(classNbr);
  if (!entry) return;
  entry.hidden = !entry.hidden;
  persist();
  render();
  notify({ type: "hide" });
}

// FR-18: replaces a scheduled section with another of the same course and
// component, keeping its place in the list and its hidden flag.
export function swapSection(oldClassNbr, newSection) {
  const entry = schedule.get(oldClassNbr);
  if (!entry || schedule.has(newSection.class_nbr)) return;
  const rebuilt = [...schedule.entries()].map(([nbr, value]) =>
    nbr === oldClassNbr
      ? [newSection.class_nbr, { section: newSection, hidden: value.hidden }]
      : [nbr, value],
  );
  schedule.clear();
  for (const [nbr, value] of rebuilt) schedule.set(nbr, value);
  // NFR-04: keep focus on the section picker if the swap came from there.
  if (document.activeElement?.dataset?.focusKey === `swap-${oldClassNbr}`) {
    pendingFocusKey = `swap-${newSection.class_nbr}`;
  }
  persist();
  render();
  notify({ type: "swap" });
}

// FR-25: restores the saved schedule from this term's catalog. Unknown class
// numbers (e.g. after a data refresh) are dropped with a one-time notice.
export function restore() {
  const items = storage.load(termCode());
  if (!items) return;
  const byClassNbr = new Map(catalog.map((section) => [section.class_nbr, section]));
  const dropped = [];
  for (const item of items) {
    const section = byClassNbr.get(item.class_nbr);
    if (section) {
      schedule.set(item.class_nbr, { section, hidden: !item.visible });
    } else {
      dropped.push(item.class_nbr);
    }
  }
  if (dropped.length > 0) {
    const [noun, verb, aux] =
      dropped.length === 1 ? ["number", "exists", "was"] : ["numbers", "exist", "were"];
    restoreNotice = `${dropped.length} saved class ${noun} no longer ${verb} and ${aux} removed: ${dropped.join(", ")}.`;
  }
  render();
  notify({ type: "restore" });
}

function formatHour(hour) {
  const period = hour < 12 || hour === 24 ? "AM" : "PM";
  const display = hour % 12 || 12;
  return `${display} ${period}`;
}

function minutesOf(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

// FR-20: Mon-Fri, 8 AM-6 PM by default; expands for a class outside that range,
// and Sat/Sun show only if a scheduled class meets then.
export function computeRange(sections) {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  const days = new Set(DEFAULT_DAYS);
  for (const section of sections) {
    for (const meeting of section.meetings || []) {
      for (const day of meeting.days) days.add(day);
      startHour = Math.min(startHour, Math.floor(minutesOf(meeting.start_time) / 60));
      endHour = Math.max(endHour, Math.ceil(minutesOf(meeting.end_time) / 60));
    }
  }
  return { days: DAY_ORDER.filter((day) => days.has(day)), startHour, endHour };
}

// FR-21, FR-22: every scheduled pair that conflicts under BR-08. Both sections in
// a conflicting pair stay and get flagged; nothing is removed or blocked (BR-09).
function findConflicts(sections) {
  const conflicted = new Set();
  const pairs = [];
  for (let i = 0; i < sections.length; i += 1) {
    for (let j = i + 1; j < sections.length; j += 1) {
      if (sectionsConflict(sections[i], sections[j])) {
        conflicted.add(sections[i].class_nbr);
        conflicted.add(sections[j].class_nbr);
        pairs.push([sections[i], sections[j]]);
      }
    }
  }
  return { conflicted, pairs };
}

export function describeSection(section) {
  return `${section.course_code} section ${section.section}`;
}

function shortLabel(section) {
  return `${section.course_code} · ${section.section}`;
}

function meetingsText(section) {
  return section.meetings.length > 0
    ? section.meetings.map((m) => m.text).join("; ")
    : "No set time";
}

// Each course keeps one color, picked by its first place in the schedule, so a
// lecture and its lab match.
function colorIndexes(scheduleEntries) {
  const colors = new Map();
  for (const { section } of scheduleEntries) {
    const key = courseKey(section);
    if (!colors.has(key)) colors.set(key, colors.size % COLOR_COUNT);
  }
  return colors;
}

function buildConflictBanner(pairs) {
  const banner = document.createElement("p");
  banner.className = "conflict-banner";
  banner.setAttribute("role", "alert");
  const names = pairs.map(([a, b]) => `${describeSection(a)} and ${describeSection(b)}`);
  banner.textContent = `Schedule conflict: ${names.join("; ")}.`;
  return banner;
}

// A single-line label only; a 50-minute block is too short for interactive
// controls, so Remove/Hide/Switch/Copy all live in the list (FR-17 to FR-19,
// FR-27). Full detail, and conflict and incomplete-time notes, go in the title
// tooltip.
function buildBlock(entry, meeting, conflicted, color) {
  const { section, hidden } = entry;
  const block = document.createElement("div");
  block.className = `calendar-block course-color-${color}`;
  block.dataset.classNbr = section.class_nbr;
  if (hidden) block.classList.add("calendar-block-hidden");
  if (conflicted) block.classList.add("calendar-block-conflict");

  let detail = `${section.title} — ${describeSection(section)} · ${meeting.text}`;
  if (conflicted) detail += " (conflict)";
  if (section.meetings_may_be_incomplete) detail += " (meeting times may be incomplete)";
  block.title = detail;

  const label = document.createElement("span");
  label.className = "calendar-block-label";
  label.textContent = shortLabel(section);
  block.append(label);
  return block;
}

// Gives overlapping blocks on the same day their own side-by-side column, so a
// conflicting pair (same day, same time) is still visible instead of rendering
// on top of each other (FR-22: both sections stay and are outlined). Touching
// times, which don't count as a conflict (BR-08), can still share a slot.
function layoutDayEntries(dayEntries) {
  const sorted = [...dayEntries].sort((a, b) => a.startMin - b.startMin);
  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds = [];
    for (const item of cluster) {
      let column = columnEnds.findIndex((end) => end <= item.startMin);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(item.endMin);
      } else {
        columnEnds[column] = item.endMin;
      }
      item.column = column;
    }
    for (const item of cluster) item.columnCount = columnEnds.length;
    placed.push(...cluster);
    cluster = [];
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();
  return placed;
}

function placeBlock(element, startMin, endMin, startHour) {
  element.style.top = `${(startMin / 60 - startHour) * HOUR_HEIGHT_PX}px`;
  element.style.height = `${((endMin - startMin) / 60) * HOUR_HEIGHT_PX}px`;
}

function buildGrid(gridEntries, conflicted, colors) {
  const { days, startHour, endHour } = computeRange(gridEntries.map((e) => e.section));
  const columnHeight = (endHour - startHour) * HOUR_HEIGHT_PX;

  const element = document.createElement("div");
  element.className = "calendar-grid";
  element.style.setProperty("--day-count", String(days.length));
  element.style.setProperty("--hour-height", `${HOUR_HEIGHT_PX}px`);

  element.append(document.createElement("div")); // Corner cell above the hour labels.
  for (const day of days) {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    element.append(header);
  }

  const hourColumn = document.createElement("div");
  hourColumn.className = "calendar-hours";
  hourColumn.style.height = `${columnHeight}px`;
  for (let hour = startHour; hour < endHour; hour += 1) {
    const label = document.createElement("div");
    label.className = "calendar-hour-label";
    label.style.height = `${HOUR_HEIGHT_PX}px`;
    label.textContent = formatHour(hour);
    hourColumn.append(label);
  }
  element.append(hourColumn);

  const columns = new Map();
  for (const day of days) {
    const column = document.createElement("div");
    column.className = "calendar-day-column";
    column.style.height = `${columnHeight}px`;

    const dayEntries = [];
    for (const entry of gridEntries) {
      for (const meeting of entry.section.meetings) {
        if (!meeting.days.includes(day)) continue;
        dayEntries.push({
          entry,
          meeting,
          startMin: minutesOf(meeting.start_time),
          endMin: minutesOf(meeting.end_time),
        });
      }
    }

    for (const placed of layoutDayEntries(dayEntries)) {
      const block = buildBlock(
        placed.entry,
        placed.meeting,
        conflicted.has(placed.entry.section.class_nbr),
        colors.get(courseKey(placed.entry.section)),
      );
      placeBlock(block, placed.startMin, placed.endMin, startHour);
      block.dataset.startMin = String(placed.startMin);
      block.dataset.endMin = String(placed.endMin);
      const widthPct = 100 / placed.columnCount;
      block.style.left = `calc(${placed.column * widthPct}% + 2px)`;
      block.style.width = `calc(${widthPct}% - 4px)`;
      column.append(block);
    }
    columns.set(day, column);
    element.append(column);
  }

  return { element, days, startHour, endHour, columns };
}

function buildCopyButton(section) {
  const classNbr = section.class_nbr;
  const wrapper = document.createElement("span");
  wrapper.className = "copy-wrap";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-btn";
  button.textContent = "Copy #";
  button.setAttribute("aria-label", `Copy class number for ${describeSection(section)}`);
  button.dataset.focusKey = `copy-${classNbr}`;
  const feedback = document.createElement("span");
  feedback.className = "copy-feedback";
  feedback.setAttribute("role", "status");
  button.addEventListener("click", async () => {
    const copied = await copyClassNumber(classNbr);
    feedback.textContent = copied ? "Copied!" : `Copy by hand: ${classNbr}`;
    window.setTimeout(() => {
      feedback.textContent = "";
    }, 4000);
  });
  wrapper.append(button, feedback);
  return wrapper;
}

// FR-18: a picker showing the current section, with the course's other
// sections of the same component to switch to in place. Options that would
// clash with the rest of the schedule say so.
function buildSectionPicker(entry, scheduleEntries) {
  const { section } = entry;
  const alternates = findAlternates(section, catalog).filter((alt) => !schedule.has(alt.class_nbr));
  if (alternates.length === 0) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `Sec ${section.section}`;
    return badge;
  }
  const others = scheduleEntries.filter((e) => e.section.class_nbr !== section.class_nbr);
  const select = document.createElement("select");
  select.className = "swap-select";
  select.setAttribute("aria-label", `Section of ${section.course_code}, switch in place`);
  select.dataset.focusKey = `swap-${section.class_nbr}`;
  select.append(new Option(`Sec ${section.section}`, section.class_nbr, true, true));
  for (const alt of alternates) {
    const clash = sectionAction(alt, others).conflicts.length > 0 ? " (conflict)" : "";
    select.append(new Option(`Sec ${alt.section} · ${meetingsText(alt)}${clash}`, alt.class_nbr));
  }
  select.addEventListener("change", () => {
    const chosen = alternates.find((alt) => alt.class_nbr === select.value);
    if (chosen) swapSection(section.class_nbr, chosen);
  });
  return select;
}

// FR-17 to FR-19, FR-27: the compact controls for one scheduled class — switch
// section, copy, hide/show, and remove.
function buildScheduleRow(entry, conflicted, color, scheduleEntries) {
  const { section, hidden } = entry;
  const li = document.createElement("li");
  li.className = "schedule-row";
  if (hidden) li.classList.add("schedule-row-hidden");
  if (conflicted) li.classList.add("schedule-row-conflict");

  const swatch = document.createElement("span");
  swatch.className = `schedule-swatch course-color-${color}`;
  swatch.setAttribute("aria-hidden", "true");

  const main = document.createElement("div");
  main.className = "schedule-row-main";
  // The class name leads; the code sits under it, as on the result cards.
  const title = document.createElement("span");
  title.className = "schedule-row-title";
  title.textContent = section.title;
  const label = document.createElement("span");
  label.className = "schedule-row-label";
  label.textContent = section.course_code;
  const time = document.createElement("span");
  time.className = "schedule-row-time";
  if (section.meetings.length > 0) appendMeetingLines(time, section.meetings);
  else time.textContent = "No set time";
  main.append(title, label, time);

  // FR-22: color isn't the only signal; the row names the conflict too.
  if (conflicted) {
    const conflictChip = document.createElement("span");
    conflictChip.className = "chip conflict-chip";
    conflictChip.textContent = "Conflict";
    main.append(conflictChip);
  }
  if (hidden) {
    const hiddenChip = document.createElement("span");
    hiddenChip.className = "chip";
    hiddenChip.textContent = "Hidden";
    main.append(hiddenChip);
  }
  if (section.meetings_may_be_incomplete) {
    const note = document.createElement("span");
    note.className = "chip incomplete-chip";
    note.textContent = "Meeting times may be incomplete. Check classes.tcu.edu.";
    main.append(note);
  }

  const actions = document.createElement("div");
  actions.className = "schedule-row-actions";
  actions.append(buildSectionPicker(entry, scheduleEntries), buildCopyButton(section));

  // The text says what the button does next, so it isn't also a pressed toggle.
  const hideButton = document.createElement("button");
  hideButton.type = "button";
  hideButton.className = "hide-btn";
  hideButton.textContent = hidden ? "Show" : "Hide";
  hideButton.setAttribute("aria-label", `${hidden ? "Show" : "Hide"} ${describeSection(section)}`);
  hideButton.dataset.focusKey = `hide-${section.class_nbr}`;
  hideButton.addEventListener("click", () => toggleHidden(section.class_nbr));

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-btn";
  removeButton.textContent = "Remove";
  removeButton.setAttribute("aria-label", `Remove ${describeSection(section)}`);
  removeButton.dataset.focusKey = `remove-${section.class_nbr}`;
  removeButton.addEventListener("click", () => removeSection(section.class_nbr));
  actions.append(hideButton, removeButton);

  li.append(swatch, main, actions);
  return li;
}

function buildScheduleList(scheduleEntries, conflicted, colors) {
  const wrapper = document.createElement("div");
  wrapper.className = "schedule-list-wrap";
  const heading = document.createElement("h3");
  heading.id = "scheduled-heading";
  heading.className = "visually-hidden";
  heading.tabIndex = -1; // A focus target when the focused row is removed.
  heading.textContent = "Scheduled classes";
  const list = document.createElement("ul");
  list.className = "schedule-list";
  for (const entry of scheduleEntries) {
    list.append(
      buildScheduleRow(
        entry,
        conflicted.has(entry.section.class_nbr),
        colors.get(courseKey(entry.section)),
        scheduleEntries,
      ),
    );
  }
  wrapper.append(heading, list);
  return wrapper;
}

// NFR-04: after a re-render, put focus back on the same control if it still
// exists; otherwise on the list heading, or the panel heading if the list is gone.
function restoreFocus(container, focusKey) {
  if (!focusKey) return;
  const target =
    container.querySelector(`[data-focus-key="${focusKey}"]`) ||
    document.getElementById("scheduled-heading") ||
    document.getElementById("calendar-heading");
  if (target) target.focus();
}

function renderCredits(scheduleEntries) {
  const badge = document.getElementById("credit-total");
  if (!badge) return;
  const total = totalCredits(scheduleEntries);
  const empty = total.hours === 0 && total.variable === 0;
  badge.hidden = empty; // BR-18
  badge.textContent = empty ? "" : creditsText(total);
  badge.title =
    total.variable > 0
      ? "Variable-credit courses (catalog numbers ending in 0) aren't counted."
      : "Each course counts once. Hidden backups aren't counted.";
}

function render() {
  const container = document.getElementById("calendar-body");
  if (!container) return;
  const active = document.activeElement;
  const focusKey =
    pendingFocusKey ||
    (active && container.contains(active) ? active.dataset.focusKey || "scheduled-heading" : null);
  pendingFocusKey = null;
  container.textContent = "";

  const scheduleEntries = entries();
  renderCredits(scheduleEntries);

  if (!storageOk) {
    const warning = document.createElement("p");
    warning.className = "storage-warning";
    warning.setAttribute("role", "alert");
    warning.textContent =
      "Storage is full or unavailable, so changes to your schedule won't be saved.";
    container.append(warning);
  }

  if (restoreNotice) {
    const notice = document.createElement("p");
    notice.className = "status-message";
    notice.setAttribute("role", "status");
    notice.textContent = restoreNotice;
    container.append(notice);
    restoreNotice = null;
  }

  // BR-10: a section with no set time can't go on the grid or conflict with anything.
  const onGrid = scheduleEntries.filter((e) => e.section.meetings.length > 0);
  // FR-19: hidden sections don't count as conflicts.
  const visibleOnGrid = onGrid.filter((e) => !e.hidden).map((e) => e.section);
  const { conflicted, pairs } = findConflicts(visibleOnGrid);
  const colors = colorIndexes(scheduleEntries);

  if (pairs.length > 0) container.append(buildConflictBanner(pairs));

  if (scheduleEntries.length === 0) {
    const hint = document.createElement("p");
    hint.className = "status-message schedule-hint";
    hint.textContent = "Add a class from search to start your schedule.";
    container.append(hint);
  } else {
    container.append(buildScheduleList(scheduleEntries, conflicted, colors));
  }

  const note = document.createElement("p");
  note.className = "preview-note";
  note.setAttribute("aria-hidden", "true"); // Visual only; rows already name conflicts.
  const built = buildGrid(onGrid, conflicted, colors);
  grid = { ...built, note };
  container.append(note, built.element);
  restoreFocus(container, focusKey);
}

// FR-44: a ghost block for each meeting of a hovered or focused result, red
// where it overlaps a scheduled class. Scheduled blocks it clashes with get a
// red ring, and a section it would replace (Switch) fades out. Purely visual;
// nothing is saved. Meetings outside the grid's hours or days are named in the
// note above the grid instead.
export function preview(section) {
  clearPreview();
  if (!grid || schedule.has(section.class_nbr)) return;
  const action = sectionAction(section, entries());
  const conflictNbrs = new Set(action.conflicts.map((s) => s.class_nbr));
  let offGrid = false;

  for (const meeting of section.meetings || []) {
    const startMin = minutesOf(meeting.start_time);
    const endMin = minutesOf(meeting.end_time);
    for (const day of meeting.days) {
      const column = grid.columns.get(day);
      const clippedStart = Math.max(startMin, grid.startHour * 60);
      const clippedEnd = Math.min(endMin, grid.endHour * 60);
      if (!column || clippedEnd <= clippedStart) {
        offGrid = true;
        continue;
      }
      const clash = action.conflicts.some((other) =>
        other.meetings.some(
          (m) =>
            m.days.includes(day) &&
            minutesOf(m.start_time) < endMin &&
            startMin < minutesOf(m.end_time),
        ),
      );
      const ghost = document.createElement("div");
      ghost.className = clash ? "calendar-ghost calendar-ghost-conflict" : "calendar-ghost";
      placeBlock(ghost, clippedStart, clippedEnd, grid.startHour);
      // Blocks it shares time with move to the left half, so both labels read.
      let shared = false;
      for (const block of column.querySelectorAll(".calendar-block")) {
        if (Number(block.dataset.startMin) < endMin && startMin < Number(block.dataset.endMin)) {
          block.classList.add("calendar-block-squeezed");
          shared = true;
        }
      }
      if (shared) ghost.classList.add("calendar-ghost-half");
      const label = document.createElement("span");
      label.className = "calendar-block-label";
      label.textContent = shortLabel(section);
      ghost.append(label);
      column.append(ghost);
    }
  }

  for (const column of grid.columns.values()) {
    for (const block of column.querySelectorAll(".calendar-block")) {
      if (conflictNbrs.has(block.dataset.classNbr)) block.classList.add("calendar-block-clash");
      if (action.replaces && block.dataset.classNbr === action.replaces.class_nbr) {
        block.classList.add("calendar-block-replacing");
      }
    }
  }

  const parts = [`Preview: ${shortLabel(section)}`];
  if ((section.meetings || []).length === 0) parts.push("no set time");
  if (action.replaces) parts.push(`replaces section ${action.replaces.section}`);
  if (action.conflicts.length > 0) {
    parts.push(`overlaps ${action.conflicts.map(shortLabel).join(", ")}`);
  }
  if (offGrid) parts.push("also meets outside these hours");
  grid.note.textContent = parts.join(" — ");
  grid.note.classList.toggle("preview-note-conflict", action.conflicts.length > 0);
}

export function clearPreview() {
  if (!grid) return;
  for (const column of grid.columns.values()) {
    for (const ghost of column.querySelectorAll(".calendar-ghost")) ghost.remove();
    for (const block of column.querySelectorAll(
      ".calendar-block-clash, .calendar-block-replacing, .calendar-block-squeezed",
    )) {
      block.classList.remove(
        "calendar-block-clash",
        "calendar-block-replacing",
        "calendar-block-squeezed",
      );
    }
  }
  grid.note.textContent = "";
  grid.note.classList.remove("preview-note-conflict");
}

export function init() {
  storageOk = storage.isAvailable();
  render();
}
