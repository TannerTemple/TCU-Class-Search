// FR-16, FR-17, FR-20, FR-23: add/remove sections onto a weekly grid, with an
// Unscheduled list for sections with no set time (BR-10). FR-21, FR-22: BR-08
// conflicts are warnings only (BR-09) — both sections stay, outlined, with a
// banner naming them. The schedule lives in memory only; autosave is FR-24 (#13).
import { sectionsConflict } from "./conflicts.js";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEFAULT_START_HOUR = 8; // FR-20
const DEFAULT_END_HOUR = 22;
const HOUR_HEIGHT_PX = 48;

const schedule = new Map(); // class_nbr -> section
const listeners = [];

function notify() {
  for (const listener of listeners) listener();
}

export function isScheduled(classNbr) {
  return schedule.has(classNbr);
}

export function onChange(listener) {
  listeners.push(listener);
}

// FR-16: one entry per class number; adding an already-scheduled section does nothing.
export function addSection(section) {
  if (schedule.has(section.class_nbr)) return;
  schedule.set(section.class_nbr, section);
  render();
  notify();
}

// FR-17: leaves the calendar; the caller's own row listens via onChange to flip
// its Add button back.
export function removeSection(classNbr) {
  if (!schedule.delete(classNbr)) return;
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

function buildRemoveButton(section, compact) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = compact ? "remove-btn remove-btn-compact" : "remove-btn";
  button.textContent = compact ? "×" : "Remove";
  button.setAttribute("aria-label", `Remove ${describeSection(section)}`);
  button.addEventListener("click", () => removeSection(section.class_nbr));
  return button;
}

function buildConflictBanner(pairs) {
  const banner = document.createElement("p");
  banner.className = "conflict-banner";
  banner.setAttribute("role", "alert");
  const names = pairs.map(([a, b]) => `${describeSection(a)} and ${describeSection(b)}`);
  banner.textContent = `Schedule conflict: ${names.join("; ")}.`;
  return banner;
}

// A single row (label + a small remove control) so even a 50-minute block, which
// is too short to stack lines in, still fits a working Remove button (FR-17).
// The full detail, and a conflict note, go in the title tooltip instead.
function buildBlock(section, meeting, conflicted) {
  const block = document.createElement("div");
  block.className = conflicted ? "calendar-block calendar-block-conflict" : "calendar-block";
  const detail = `${describeSection(section)} · ${meeting.text}`;
  block.title = conflicted ? `${detail} (conflict)` : detail;

  const label = document.createElement("span");
  label.className = "calendar-block-label";
  label.textContent = `${section.course_code} · ${section.section}`;
  block.append(label, buildRemoveButton(section, true));
  return block;
}

// Gives overlapping blocks on the same day their own side-by-side column, so a
// conflicting pair (same day, same time) is still visible and clickable instead
// of rendering on top of each other (FR-22: both sections stay and are outlined).
// Touching times, which don't count as a conflict (BR-08), can still share a slot.
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

function buildGrid(sections, conflicted) {
  const { days, startHour, endHour } = computeRange(sections);
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

    const entries = [];
    for (const section of sections) {
      for (const meeting of section.meetings) {
        if (!meeting.days.includes(day)) continue;
        entries.push({
          section,
          meeting,
          startMin: minutesOf(meeting.start_time),
          endMin: minutesOf(meeting.end_time),
        });
      }
    }

    for (const entry of layoutDayEntries(entries)) {
      const block = buildBlock(
        entry.section,
        entry.meeting,
        conflicted.has(entry.section.class_nbr),
      );
      block.style.top = `${(entry.startMin / 60 - startHour) * HOUR_HEIGHT_PX}px`;
      block.style.height = `${((entry.endMin - entry.startMin) / 60) * HOUR_HEIGHT_PX}px`;
      const widthPct = 100 / entry.columnCount;
      block.style.left = `calc(${entry.column * widthPct}% + 2px)`;
      block.style.width = `calc(${widthPct}% - 4px)`;
      column.append(block);
    }
    grid.append(column);
  }

  return grid;
}

function buildUnscheduledList(sections) {
  const wrapper = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = "Unscheduled";
  const list = document.createElement("ul");
  list.className = "unscheduled-list";
  for (const section of sections) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = describeSection(section);
    item.append(label, buildRemoveButton(section));
    list.append(item);
  }
  wrapper.append(heading, list);
  return wrapper;
}

function render() {
  const container = document.getElementById("calendar-body");
  if (!container) return;
  container.textContent = "";

  const sections = [...schedule.values()];
  if (sections.length === 0) {
    const hint = document.createElement("p");
    hint.className = "status-message";
    hint.textContent = "Add a class from search to start your schedule.";
    container.append(hint);
    return;
  }

  // BR-10: a section with no set time can't go on the grid or conflict with anything.
  const onGrid = sections.filter((s) => s.meetings.length > 0);
  const unscheduled = sections.filter((s) => s.meetings.length === 0);
  const { conflicted, pairs } = findConflicts(onGrid);

  if (pairs.length > 0) {
    container.append(buildConflictBanner(pairs));
  }
  if (onGrid.length > 0) {
    container.append(buildGrid(onGrid, conflicted));
  }
  if (unscheduled.length > 0) {
    container.append(buildUnscheduledList(unscheduled));
  }
}

export function init() {
  render();
}
