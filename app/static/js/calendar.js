// FR-16, FR-17, FR-20, FR-23: add/remove sections onto a weekly grid, with an
// Unscheduled list for sections with no set time (BR-10). FR-21, FR-22: BR-08
// conflicts are warnings only (BR-09) — both sections stay, outlined, with a
// banner naming them. FR-18, FR-19: swap for another section of the same course
// and component (BR-11), and hide/show a backup (hidden ones are gray and don't
// count as conflicts). FR-24 to FR-26: autosaved via storage.js; restores on
// load, and warns if storage can't save (BR-12). FR-27: every scheduled class,
// including Unscheduled and hidden ones, gets its own copy button (D-31).
import { sectionsConflict } from "./conflicts.js";
import { copyClassNumber } from "./clipboard.js";
import { storage } from "./storage.js";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEFAULT_START_HOUR = 8; // FR-20
const DEFAULT_END_HOUR = 22;
const HOUR_HEIGHT_PX = 48;

const schedule = new Map(); // class_nbr -> { section, hidden }
const listeners = [];
let catalog = [];
let storageOk = true;
let restoreNotice = null;

function notify() {
  for (const listener of listeners) listener();
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
export function findAlternates(section, sections) {
  return sections.filter(
    (s) =>
      s.course_code === section.course_code &&
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
  notify();
}

// FR-17: leaves the calendar; the caller's own row listens via onChange to flip
// its Add button back.
export function removeSection(classNbr) {
  if (!schedule.delete(classNbr)) return;
  persist();
  render();
  notify();
}

// FR-19: toggles a scheduled section gray; hidden sections don't count as conflicts.
export function toggleHidden(classNbr) {
  const entry = schedule.get(classNbr);
  if (!entry) return;
  entry.hidden = !entry.hidden;
  persist();
  render();
  notify();
}

// FR-18: replaces a scheduled section with another of the same course and
// component, keeping its hidden flag.
export function swapSection(oldClassNbr, newSection) {
  const entry = schedule.get(oldClassNbr);
  if (!entry) return;
  schedule.delete(oldClassNbr);
  schedule.set(newSection.class_nbr, { section: newSection, hidden: entry.hidden });
  persist();
  render();
  notify();
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
  notify();
}

function formatHour(hour) {
  const period = hour < 12 ? "AM" : "PM";
  const display = hour % 12 || 12;
  return `${display} ${period}`;
}

function minutesOf(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

// FR-20: Mon-Fri, 8 AM-10 PM by default; expands for a class outside that range,
// and Sat/Sun show only if a scheduled class meets then.
function computeRange(sections) {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  const days = new Set(DEFAULT_DAYS);
  for (const section of sections) {
    for (const meeting of section.meetings) {
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

function describeSection(section) {
  return `${section.course_code} section ${section.section}`;
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
// controls, so Remove/Hide/Swap/Copy all live in the roomier list below (FR-17
// to FR-19, FR-27). Full detail, and conflict and incomplete-time notes, go in
// the title tooltip.
function buildBlock(entry, meeting, conflicted) {
  const { section, hidden } = entry;
  const block = document.createElement("div");
  block.className = "calendar-block";
  if (hidden) block.classList.add("calendar-block-hidden");
  if (conflicted) block.classList.add("calendar-block-conflict");

  let detail = `${describeSection(section)} · ${meeting.text}`;
  if (conflicted) detail += " (conflict)";
  if (section.meetings_may_be_incomplete) detail += " (meeting times may be incomplete)";
  block.title = detail;

  const label = document.createElement("span");
  label.className = "calendar-block-label";
  label.textContent = `${section.course_code} · ${section.section}`;
  block.append(label);
  return block;
}

// Gives overlapping blocks on the same day their own side-by-side column, so a
// conflicting pair (same day, same time) is still visible instead of rendering
// on top of each other (FR-22: both sections stay and are outlined). Touching
// times, which don't count as a conflict (BR-08), can still share a slot.
function layoutDayEntries(entries) {
  const sorted = [...entries].sort((a, b) => a.startMin - b.startMin);
  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds = [];
    for (const entry of cluster) {
      let column = columnEnds.findIndex((end) => end <= entry.startMin);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(entry.endMin);
      } else {
        columnEnds[column] = entry.endMin;
      }
      entry.column = column;
    }
    for (const entry of cluster) entry.columnCount = columnEnds.length;
    placed.push(...cluster);
    cluster = [];
  };

  for (const entry of sorted) {
    if (cluster.length > 0 && entry.startMin >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.endMin);
  }
  flush();
  return placed;
}

function buildGrid(entries, conflicted) {
  const { days, startHour, endHour } = computeRange(entries.map((e) => e.section));
  const columnHeight = (endHour - startHour) * HOUR_HEIGHT_PX;

  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  grid.style.setProperty("--day-count", String(days.length));

  grid.append(document.createElement("div")); // Corner cell above the hour labels.
  for (const day of days) {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    grid.append(header);
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
  grid.append(hourColumn);

  for (const day of days) {
    const column = document.createElement("div");
    column.className = "calendar-day-column";
    column.style.height = `${columnHeight}px`;

    const dayEntries = [];
    for (const entry of entries) {
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
      );
      block.style.top = `${(placed.startMin / 60 - startHour) * HOUR_HEIGHT_PX}px`;
      block.style.height = `${((placed.endMin - placed.startMin) / 60) * HOUR_HEIGHT_PX}px`;
      const widthPct = 100 / placed.columnCount;
      block.style.left = `calc(${placed.column * widthPct}% + 2px)`;
      block.style.width = `calc(${widthPct}% - 4px)`;
      column.append(block);
    }
    grid.append(column);
  }

  return grid;
}

function buildCopyButton(classNbr) {
  const wrapper = document.createElement("span");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-btn";
  button.textContent = "Copy number";
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

// FR-17 to FR-19, FR-27: the full set of controls for one scheduled class —
// copy, hide/show, swap, and remove — all in one roomy row.
function buildScheduleRow(entry) {
  const { section, hidden } = entry;
  const li = document.createElement("li");
  li.className = "schedule-row";
  if (hidden) li.classList.add("schedule-row-hidden");

  const main = document.createElement("div");
  main.className = "schedule-row-main";
  const label = document.createElement("span");
  label.className = "schedule-row-label";
  label.textContent = describeSection(section);
  main.append(label);

  const meetingText =
    section.meetings.length > 0
      ? section.meetings.map((m) => m.text).join("; ")
      : "No set time";
  const meetingChip = document.createElement("span");
  meetingChip.className = "chip";
  meetingChip.textContent = meetingText;
  main.append(meetingChip);

  if (section.meetings_may_be_incomplete) {
    const note = document.createElement("span");
    note.className = "chip incomplete-chip";
    note.textContent = "Meeting times may be incomplete. Check classes.tcu.edu.";
    main.append(note);
  }

  const actions = document.createElement("div");
  actions.className = "schedule-row-actions";
  actions.append(buildCopyButton(section.class_nbr));

  const hideButton = document.createElement("button");
  hideButton.type = "button";
  hideButton.className = "hide-btn";
  hideButton.textContent = hidden ? "Show" : "Hide";
  hideButton.setAttribute("aria-pressed", String(hidden));
  hideButton.addEventListener("click", () => toggleHidden(section.class_nbr));
  actions.append(hideButton);

  const alternates = findAlternates(section, catalog);
  if (alternates.length > 0) {
    const select = document.createElement("select");
    select.className = "swap-select";
    select.setAttribute("aria-label", `Swap ${describeSection(section)}`);
    select.append(new Option("Swap for…", "", true, true));
    for (const alt of alternates) {
      const altMeeting = alt.meetings.length > 0 ? alt.meetings.map((m) => m.text).join("; ") : "No set time";
      select.append(new Option(`Section ${alt.section} · ${altMeeting}`, alt.class_nbr));
    }
    select.addEventListener("change", () => {
      const chosen = alternates.find((alt) => alt.class_nbr === select.value);
      if (chosen) swapSection(section.class_nbr, chosen);
    });
    actions.append(select);
  }

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-btn";
  removeButton.textContent = "Remove";
  removeButton.setAttribute("aria-label", `Remove ${describeSection(section)}`);
  removeButton.addEventListener("click", () => removeSection(section.class_nbr));
  actions.append(removeButton);

  li.append(main, actions);
  return li;
}

function buildScheduleList(entries) {
  const wrapper = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = "Scheduled classes";
  const list = document.createElement("ul");
  list.className = "schedule-list";
  for (const entry of entries) {
    list.append(buildScheduleRow(entry));
  }
  wrapper.append(heading, list);
  return wrapper;
}

function render() {
  const container = document.getElementById("calendar-body");
  if (!container) return;
  container.textContent = "";

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

  const entries = [...schedule.values()];
  if (entries.length === 0) {
    const hint = document.createElement("p");
    hint.className = "status-message";
    hint.textContent = "Add a class from search to start your schedule.";
    container.append(hint);
    return;
  }

  // BR-10: a section with no set time can't go on the grid or conflict with anything.
  const onGrid = entries.filter((e) => e.section.meetings.length > 0);
  // FR-19: hidden sections don't count as conflicts.
  const visibleOnGrid = onGrid.filter((e) => !e.hidden).map((e) => e.section);
  const { conflicted, pairs } = findConflicts(visibleOnGrid);

  if (pairs.length > 0) {
    container.append(buildConflictBanner(pairs));
  }
  if (onGrid.length > 0) {
    container.append(buildGrid(onGrid, conflicted));
  }
  container.append(buildScheduleList(entries));
}

export function init() {
  storageOk = storage.isAvailable();
  render();
}
