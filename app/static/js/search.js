// FR-01 to FR-13, FR-41: fetch the sections payload once, then search and filter
// in the browser (D-19). Results are one card per course with its sections as
// rows (FR-11), rendered 25 courses at a time (NFR-01).
import * as calendar from "./calendar.js";
import {
  START_BANDS,
  appendMeetingLines,
  creditHours,
  groupCourses,
  matchesCore,
  matchesDays,
  matchesStart,
  sectionAction,
} from "./courses.js";
import * as popup from "./popup.js";

const DAY_BUTTONS = [
  // [value, visible label, accessible name]. Each name starts with its label (NFR-04).
  ["Mon", "M", "Monday"],
  ["Tue", "T", "Tuesday"],
  ["Wed", "W", "Wednesday"],
  ["Thu", "Th", "Thursday"],
  ["Fri", "F", "Friday"],
  ["Sat", "Sa", "Saturday"],
  ["Sun", "Su", "Sunday"],
];

const LEVEL_BANDS = [
  // D-26, OQ-17: value, label, and the [min, max] catalog number range.
  ["10000-29999", "10000–29999", [10000, 29999]],
  ["30000-49999", "30000–49999", [30000, 49999]],
  ["50000-plus", "50000 and up", [50000, 99999]],
];

export const CORE_CODES = [
  // docs/06-data-dictionary.md
  ["CSV", "Citizenship & Social Values"],
  ["CA", "Cultural Awareness"],
  ["FAR", "Fine Arts"],
  ["GA", "Global Awareness"],
  ["HUM", "Humanities"],
  ["HT", "Historical Traditions"],
  ["LT", "Literary Traditions"],
  ["MTH", "Mathematics"],
  ["NSC", "Natural Sciences"],
  ["OCO", "Oral Communication"],
  ["RT", "Religious Traditions"],
  ["SSC", "Social Sciences"],
  ["WCO", "Written Communication"],
  ["WEM", "Writing Emphasis"],
];
const CORE_NAMES = new Map(CORE_CODES);

const COURSES_PER_PAGE = 25; // NFR-01
const SECTIONS_SHOWN = 5; // Per card, before "Show N more sections".

function normalizeTerms(query) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// FR-01: matches subject, course number, and title, case-insensitively.
function matchesQuery(section, terms) {
  if (terms.length === 0) return true;
  const haystack = `${section.course_code} ${section.title}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

// FR-02 to FR-09: every active filter must match (FR-10: AND).
function matchesFilters(section, filters) {
  if (filters.subject && section.subject !== filters.subject) return false;
  if (filters.status && section.status !== filters.status) return false;
  if (filters.session && section.session_code !== filters.session) return false;
  if (filters.mode && section.instruction_mode !== filters.mode) return false;
  if (filters.level) {
    const catalogNbr = Number(section.catalog_nbr);
    if (catalogNbr < filters.level[0] || catalogNbr > filters.level[1]) return false;
  }
  if (filters.core && !matchesCore(section, filters.core, filters.coreMode)) return false;
  if (filters.days && !matchesDays(section, filters.days, filters.daysMode)) return false;
  if (!matchesStart(section, filters.startBands, filters.startRange)) return false;
  return matchesQuery(section, filters.terms || []);
}

// ---------------------------------------------------------------------------
// Result cards

// class_nbr -> { section, row, button, note } for every rendered row, so a
// schedule change can update them in place. Re-rendering the list would
// destroy the focused button (NFR-04) and the pop-up's opener.
let renderedRows = new Map();

function badge(text, extraClass) {
  const el = document.createElement("span");
  el.className = extraClass ? `badge ${extraClass}` : "badge";
  el.textContent = text;
  return el;
}

function shortName(section) {
  return `${section.course_code} · ${section.section}`;
}

// FR-16, FR-18, FR-21: the row's button and conflict note follow the schedule.
// A conflict is a warning, so the button still works (BR-09).
function syncRow(record, scheduleEntries) {
  const { section, row, button, note, remove } = record;
  const action = sectionAction(section, scheduleEntries);
  const label = calendar.describeSection(section);
  const state = calendar.addButtonState(action.kind === "added", label, action.kind);
  const conflictText =
    action.conflicts.length > 0 ? `Overlaps ${action.conflicts.map(shortName).join(", ")}` : "";

  button.textContent = state.text;
  button.setAttribute(
    "aria-label",
    conflictText ? `${state.ariaLabel}. ${conflictText}` : state.ariaLabel,
  );
  button.setAttribute("aria-disabled", state.ariaDisabled);
  button.dataset.kind = action.kind;
  button.classList.toggle("add-btn-conflict", conflictText !== "");
  row.classList.toggle("section-row-conflict", conflictText !== "");
  row.classList.toggle("section-row-added", action.kind === "added");
  note.textContent = conflictText ? `⚠ ${conflictText}` : "";
  note.hidden = conflictText === ""; // BR-18
  remove.hidden = action.kind !== "added"; // FR-17: remove from the results too.
}

function syncAllRows() {
  const scheduleEntries = calendar.entries();
  for (const record of renderedRows.values()) syncRow(record, scheduleEntries);
}

function buildStatus(section, statusAsOf) {
  // BR-05, BR-21: a dot and the word; the snapshot date is in the results
  // summary and read out to screen readers here.
  const open = section.status === "Open";
  const status = document.createElement("span");
  status.className = open ? "status status-open" : "status status-closed";
  status.title = `${section.status} as of ${statusAsOf} (snapshot)`;
  const dot = document.createElement("span");
  dot.className = "status-dot";
  dot.setAttribute("aria-hidden", "true");
  const asOf = document.createElement("span");
  asOf.className = "visually-hidden";
  asOf.textContent = ` as of ${statusAsOf}`;
  status.append(dot, section.status, asOf);
  return status;
}

// FR-11: section badge (opens the pop-up, FR-14), component, session if not
// REG, mode if not In Person, then days and times as plain text, status, and
// the action button.
function buildSectionRow(section, statusAsOf) {
  const row = document.createElement("li");
  row.className = "section-row";

  const badges = document.createElement("div");
  badges.className = "section-badges";
  const details = document.createElement("button");
  details.type = "button";
  details.className = "badge badge-section";
  details.textContent = `Sec ${section.section}`;
  details.setAttribute("aria-label", `Sec ${section.section} details, ${section.course_code}`);
  details.title = "Details and class number";
  details.addEventListener("click", () => popup.open(section, details));
  badges.append(details);
  const component = section.component_label || section.component_type;
  if (component) badges.append(badge(component));
  if (section.session_code !== "REG") {
    badges.append(badge(section.session_name || section.session_code, "badge-note"));
  }
  if (section.instruction_mode !== "In Person") {
    badges.append(badge(section.instruction_mode, "badge-note"));
  }

  const time = document.createElement("div");
  time.className = "section-time";
  appendMeetingLines(time, section.meetings || []);

  const action = document.createElement("div");
  action.className = "section-action";
  const note = document.createElement("span");
  note.className = "conflict-note";
  note.hidden = true;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-btn";
  button.dataset.classNbr = section.class_nbr;
  // FR-16: one entry per class number; a second add does nothing (UC-05).
  // FR-18: "Switch" replaces the scheduled section of this course in place.
  button.addEventListener("click", () => {
    const current = sectionAction(section, calendar.entries());
    if (current.kind === "added") return;
    if (current.kind === "switch") calendar.swapSection(current.replaces.class_nbr, section);
    else calendar.addSection(section);
    calendar.clearPreview();
  });
  // FR-17: a small × beside "Added ✓" removes the section without going to
  // My schedule. It only shows once the section is scheduled.
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "result-remove-btn";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Remove ${calendar.describeSection(section)}`);
  remove.title = "Remove from My schedule";
  remove.hidden = true;
  remove.addEventListener("click", () => {
    calendar.removeSection(section.class_nbr);
    calendar.clearPreview();
    button.focus(); // NFR-04: the × is gone now, so focus moves to the row's Add.
  });
  const buttons = document.createElement("div");
  buttons.className = "section-buttons";
  buttons.append(remove, button);
  action.append(note, buttons);

  row.append(badges, time, buildStatus(section, statusAsOf), action);

  // FR-44: hovering or focusing the row previews it on the calendar.
  row.addEventListener("mouseenter", () => calendar.preview(section));
  row.addEventListener("mouseleave", () => calendar.clearPreview());
  row.addEventListener("focusin", () => calendar.preview(section));
  row.addEventListener("focusout", (event) => {
    if (!row.contains(event.relatedTarget)) calendar.clearPreview();
  });

  const record = { section, row, button, note, remove };
  renderedRows.set(section.class_nbr, record);
  return record;
}

function buildCourseCard(group, statusAsOf, scheduleEntries) {
  const card = document.createElement("li");
  card.className = "course-card";

  const head = document.createElement("div");
  head.className = "course-card-head";
  const heading = document.createElement("h3");
  heading.className = "course-heading";
  heading.tabIndex = -1; // Focus target after "Show more courses".
  const code = document.createElement("span");
  code.className = "course-code";
  code.textContent = group.course_code;
  const title = document.createElement("span");
  title.className = "course-title";
  title.textContent = group.title;
  heading.append(code, " ", title);
  head.append(heading);

  // D-41: credit hours from the catalog number; none for variable credit (BR-18).
  const credits = creditHours(group.catalog_nbr);
  if (credits !== null) {
    const creditBadge = badge(`${credits} cr`, "credit-badge");
    creditBadge.setAttribute("aria-label", `${credits} credit hour${credits === 1 ? "" : "s"}`);
    creditBadge.title = creditBadge.getAttribute("aria-label");
    head.append(creditBadge);
  }
  card.append(head);

  // BR-20: Core tags by name, only if the course has any.
  if (group.core_codes.length > 0) {
    const tags = document.createElement("div");
    tags.className = "core-tags";
    for (const coreCode of group.core_codes) {
      const tag = badge(CORE_NAMES.get(coreCode) || coreCode, "core-tag");
      tag.title = `Core: ${coreCode}`;
      tags.append(tag);
    }
    card.append(tags);
  }

  const list = document.createElement("ul");
  list.className = "section-list";
  list.setAttribute("aria-label", `${group.course_code} sections`);
  const addRows = (from, to) => {
    for (const section of group.sections.slice(from, to)) {
      const record = buildSectionRow(section, statusAsOf);
      syncRow(record, scheduleEntries);
      list.append(record.row);
    }
  };
  addRows(0, SECTIONS_SHOWN);
  card.append(list);

  const hiddenCount = group.sections.length - SECTIONS_SHOWN;
  if (hiddenCount > 0) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "message-action show-sections-btn";
    more.textContent = `Show ${hiddenCount} more section${hiddenCount === 1 ? "" : "s"}`;
    more.addEventListener("click", () => {
      const firstNew = group.sections[SECTIONS_SHOWN];
      addRows(SECTIONS_SHOWN, group.sections.length);
      more.remove();
      // NFR-04: the button is gone, so focus moves to the first new row.
      renderedRows.get(firstNew.class_nbr)?.row.querySelector(".badge-section")?.focus();
    });
    card.append(more);
  }
  return card;
}

function setMessage(text, action) {
  const el = document.getElementById("results-message");
  el.textContent = "";
  el.append(text);
  if (action) {
    el.append(" ");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "message-action";
    button.textContent = action.label;
    button.addEventListener("click", action.onClick);
    el.append(button);
  }
  el.hidden = false;
}

function hideMessage() {
  document.getElementById("results-message").hidden = true;
}

function plural(count, word) {
  return `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;
}

let moreObserver = null;

// FR-41, NFR-01: no-results state with a clear action. Only the first 25
// courses go into the page; "Show more courses" (also triggered by scrolling
// near it) adds the next 25. FR-11: every match stays reachable.
function renderResults(groups, sectionCount, statusAsOf, onClear) {
  const list = document.getElementById("results-list");
  const summary = document.getElementById("results-summary");
  const moreWrap = document.getElementById("results-more");
  list.textContent = "";
  moreWrap.textContent = "";
  renderedRows = new Map();
  if (moreObserver) moreObserver.disconnect();
  calendar.clearPreview();

  if (groups.length === 0) {
    list.hidden = true;
    summary.hidden = true;
    setMessage("No classes match your search and filters.", { label: "Clear all", onClick: onClear });
    return;
  }

  list.hidden = false;
  hideMessage();
  summary.hidden = false;
  summary.textContent = `${plural(groups.length, "course")} · ${plural(sectionCount, "section")} · Seat status as of ${statusAsOf}`;

  let shown = 0;
  const showMore = (moveFocus) => {
    const scheduleEntries = calendar.entries();
    const fragment = document.createDocumentFragment();
    const end = Math.min(shown + COURSES_PER_PAGE, groups.length);
    const firstNew = shown;
    const cards = [];
    for (; shown < end; shown += 1) {
      const card = buildCourseCard(groups[shown], statusAsOf, scheduleEntries);
      cards.push(card);
      fragment.append(card);
    }
    list.append(fragment);
    moreWrap.textContent = "";
    if (shown < groups.length) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "show-more-btn";
      button.textContent = `Show more courses (${(groups.length - shown).toLocaleString()} left)`;
      button.addEventListener("click", () => showMore(true));
      moreWrap.append(button);
      if (moreObserver) moreObserver.observe(button);
    }
    // NFR-04: after a click, focus the first new course so keyboard users
    // continue from there instead of jumping past it.
    if (moveFocus && cards[0] && firstNew > 0) cards[0].querySelector(".course-heading").focus();
  };

  if ("IntersectionObserver" in window) {
    moreObserver = new IntersectionObserver(
      (observed) => {
        if (observed.some((entry) => entry.isIntersecting)) showMore(false);
      },
      { rootMargin: "400px 0px" },
    );
  }
  showMore(false);
}

// ---------------------------------------------------------------------------
// Filters

function distinctSorted(sections, getValue) {
  return [...new Set(sections.map(getValue))].sort((a, b) => a.localeCompare(b));
}

function sessionOptions(sections) {
  const names = new Map();
  for (const section of sections) {
    if (!names.has(section.session_code)) {
      names.set(section.session_code, section.session_name || section.session_code);
    }
  }
  return [...names.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function createSelect(id, labelText, defaultLabel, options) {
  const wrapper = document.createElement("div");
  wrapper.className = "filter-group";
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;
  const select = document.createElement("select");
  select.id = id;
  select.append(new Option(defaultLabel, ""));
  for (const [value, text] of options) {
    select.append(new Option(text, value));
  }
  wrapper.append(label, select);
  return { wrapper, select };
}

function createOptionRow(type, name, value, text, checked) {
  const row = document.createElement("label");
  row.className = "filter-option";
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value;
  input.checked = checked;
  row.append(input, document.createTextNode(` ${text}`));
  return { row, input };
}

function createFieldset(legendText) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "filter-group";
  const legend = document.createElement("legend");
  legend.textContent = legendText;
  fieldset.append(legend);
  return fieldset;
}

function toggleButton(text, ariaLabel, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("aria-pressed", "false");
  return button;
}

function isPressed(button) {
  return button.getAttribute("aria-pressed") === "true";
}

function setPressed(button, pressed) {
  button.setAttribute("aria-pressed", String(pressed));
}

// A two-option segmented control built from radio buttons.
function segmented(name, options, legendText) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "segmented";
  const legend = document.createElement("legend");
  legend.className = "visually-hidden";
  legend.textContent = legendText;
  fieldset.append(legend);
  const inputs = options.map(([value, text], i) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.checked = i === 0;
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    fieldset.append(label);
    return input;
  });
  return { fieldset, inputs };
}

// FR-04: a dual-thumb slider over the 12-hour stops the page provides (times
// are formatted in Python, D-20). An end at its limit means no limit there.
function buildTimeSlider(stops, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "time-slider";
  const output = document.createElement("p");
  output.className = "time-slider-value";
  output.setAttribute("aria-live", "polite");
  const track = document.createElement("div");
  track.className = "time-slider-track";
  const fill = document.createElement("div");
  fill.className = "time-slider-fill";
  track.append(fill);

  const make = (labelText, value) => {
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = String(stops.length - 1);
    input.step = "1";
    input.value = String(value);
    input.setAttribute("aria-label", labelText);
    track.append(input);
    return input;
  };
  const from = make("Earliest start", 0);
  const to = make("Latest start", stops.length - 1);
  const last = stops.length - 1;

  const update = () => {
    const a = Number(from.value);
    const b = Number(to.value);
    from.setAttribute("aria-valuetext", stops[a][1]);
    to.setAttribute("aria-valuetext", stops[b][1]);
    fill.style.left = `${(a / last) * 100}%`;
    fill.style.right = `${100 - (b / last) * 100}%`;
    output.textContent = `${a === 0 ? "Any time" : stops[a][1]} – ${b === last ? "any time" : stops[b][1]}`;
  };
  from.addEventListener("input", () => {
    if (Number(from.value) > Number(to.value)) from.value = to.value;
    update();
    onChange();
  });
  to.addEventListener("input", () => {
    if (Number(to.value) < Number(from.value)) to.value = from.value;
    update();
    onChange();
  });
  update();
  wrap.append(output, track);

  return {
    element: wrap,
    range: () => {
      const a = Number(from.value);
      const b = Number(to.value);
      return { from: a === 0 ? null : stops[a][0], to: b === last ? null : stops[b][0] };
    },
    reset: () => {
      from.value = "0";
      to.value = String(last);
      update();
    },
  };
}

// FR-02 to FR-09: build every filter control from the loaded data, then re-filter on change.
function buildFilters(container, sections, onChange, onClearAll) {
  container.textContent = "";
  let timeStops = [];
  try {
    timeStops = JSON.parse(container.dataset.timeStops || "[]");
  } catch {
    timeStops = [];
  }

  const { wrapper: subjectWrap, select: subjectSelect } = createSelect(
    "filter-subject",
    "Subject",
    "All subjects",
    distinctSorted(sections, (s) => s.subject).map((s) => [s, s]),
  );

  // FR-05, BR-21: one switch; permit sections count as Closed.
  const statusWrap = document.createElement("div");
  statusWrap.className = "filter-group";
  const statusLabel = document.createElement("label");
  statusLabel.className = "switch";
  const openOnly = document.createElement("input");
  openOnly.type = "checkbox";
  openOnly.id = "filter-open-only";
  openOnly.setAttribute("role", "switch");
  const track = document.createElement("span");
  track.className = "switch-track";
  track.setAttribute("aria-hidden", "true");
  statusLabel.append(openOnly, track, document.createTextNode("Open classes only"));
  statusWrap.append(statusLabel);

  // FR-03: day toggles, plus the match mode once a day is picked.
  const daysFieldset = createFieldset("Days");
  const dayRow = document.createElement("div");
  dayRow.className = "day-toggles";
  const dayButtons = DAY_BUTTONS.map(([value, text, name]) => {
    const button = toggleButton(text, name, "day-toggle");
    button.dataset.value = value;
    dayRow.append(button);
    return button;
  });
  const { fieldset: daysModeSet, inputs: daysModeInputs } = segmented(
    "filter-days-mode",
    [
      ["any", "Includes"],
      ["only", "Only these days"],
    ],
    "Day matching",
  );
  daysModeSet.hidden = true;
  daysFieldset.append(dayRow, daysModeSet);

  // FR-04: start-time chips; "Exact time" swaps them for the slider.
  const timeFieldset = createFieldset("Start time");
  const chipRow = document.createElement("div");
  chipRow.className = "chip-toggles";
  const bandButtons = START_BANDS.map(([id, label]) => {
    const button = toggleButton(label, null, "chip-toggle");
    button.dataset.value = id;
    chipRow.append(button);
    return button;
  });
  const exactButton = toggleButton("Exact time", null, "chip-toggle");
  exactButton.setAttribute("aria-expanded", "false");
  chipRow.append(exactButton);
  timeFieldset.append(chipRow);
  let slider = null;
  if (timeStops.length > 1) {
    slider = buildTimeSlider(timeStops, onChange);
    slider.element.id = "filter-time-slider";
    slider.element.hidden = true;
    exactButton.setAttribute("aria-controls", slider.element.id);
    timeFieldset.append(slider.element);
  } else {
    exactButton.hidden = true;
  }

  const { wrapper: sessionWrap, select: sessionSelect } = createSelect(
    "filter-session",
    "Session",
    "All sessions",
    sessionOptions(sections),
  );

  const { wrapper: modeWrap, select: modeSelect } = createSelect(
    "filter-mode",
    "Instruction mode",
    "All modes",
    distinctSorted(sections, (s) => s.instruction_mode).map((m) => [m, m]),
  );

  const levelFieldset = createFieldset("Course level");
  const levelInputs = [];
  const allLevelsRow = createOptionRow("radio", "filter-level", "", "All levels", true);
  levelInputs.push(allLevelsRow.input);
  levelFieldset.append(allLevelsRow.row);
  for (const [value, text] of LEVEL_BANDS) {
    const { row, input } = createOptionRow("radio", "filter-level", value, text, false);
    levelInputs.push(input);
    levelFieldset.append(row);
  }

  // FR-09: once two or more codes are checked, choose any of them or all of them.
  const coreFieldset = createFieldset("Core curriculum");
  const { fieldset: coreModeSet, inputs: coreModeInputs } = segmented(
    "filter-core-mode",
    [
      ["any", "Any selected"],
      ["all", "Double dip"],
    ],
    "Core matching",
  );
  coreModeSet.hidden = true;
  coreFieldset.append(coreModeSet);
  const coreInputs = [];
  for (const [code, name] of CORE_CODES) {
    const { row, input } = createOptionRow("checkbox", "filter-core", code, `${name} (${code})`, false);
    coreInputs.push(input);
    coreFieldset.append(row);
  }

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.id = "clear-filters";
  clearButton.className = "message-action clear-all-btn";
  clearButton.textContent = "Clear all";

  container.append(
    subjectWrap,
    statusWrap,
    daysFieldset,
    timeFieldset,
    levelFieldset,
    coreFieldset,
    // Rarely changed, so they sit last.
    sessionWrap,
    modeWrap,
    clearButton,
  );

  const exactOn = () => isPressed(exactButton);

  const getState = () => {
    const days = new Set(dayButtons.filter(isPressed).map((b) => b.dataset.value));
    return {
      subject: subjectSelect.value || null,
      status: openOnly.checked ? "Open" : null,
      days,
      daysMode: (daysModeInputs.find((el) => el.checked) || {}).value || "any",
      startBands: exactOn() ? new Set() : new Set(bandButtons.filter(isPressed).map((b) => b.dataset.value)),
      startRange: exactOn() && slider ? slider.range() : null,
      session: sessionSelect.value || null,
      mode: modeSelect.value || null,
      level: (() => {
        const value = (levelInputs.find((el) => el.checked) || {}).value;
        const band = LEVEL_BANDS.find(([v]) => v === value);
        return band ? band[2] : null;
      })(),
      core: new Set(coreInputs.filter((el) => el.checked).map((el) => el.value)),
      coreMode: (coreModeInputs.find((el) => el.checked) || {}).value || "any",
    };
  };

  const setExact = (on) => {
    setPressed(exactButton, on);
    exactButton.setAttribute("aria-expanded", String(on));
    if (slider) slider.element.hidden = !on;
  };

  // FR-10: resets every filter control. The search box is cleared separately by the
  // caller (search.init), since the box lives outside this panel.
  const resetControls = () => {
    subjectSelect.value = "";
    sessionSelect.value = "";
    modeSelect.value = "";
    openOnly.checked = false;
    for (const b of [...dayButtons, ...bandButtons]) setPressed(b, false);
    daysModeInputs[0].checked = true;
    daysModeSet.hidden = true;
    setExact(false);
    if (slider) slider.reset();
    for (const el of coreInputs) el.checked = false;
    coreModeInputs[0].checked = true;
    coreModeSet.hidden = true;
    levelInputs[0].checked = true;
  };
  clearButton.addEventListener("click", onClearAll);

  for (const button of dayButtons) {
    button.addEventListener("click", () => {
      setPressed(button, !isPressed(button));
      daysModeSet.hidden = !dayButtons.some(isPressed); // Only matters once a day is picked.
      onChange();
    });
  }
  for (const button of bandButtons) {
    button.addEventListener("click", () => {
      setPressed(button, !isPressed(button));
      if (isPressed(button)) setExact(false);
      onChange();
    });
  }
  exactButton.addEventListener("click", () => {
    const on = !exactOn();
    setExact(on);
    if (on) for (const b of bandButtons) setPressed(b, false);
    onChange();
  });

  for (const el of [subjectSelect, sessionSelect, modeSelect, openOnly]) {
    el.addEventListener("change", onChange);
  }
  for (const el of coreInputs) {
    el.addEventListener("change", () => {
      coreModeSet.hidden = coreInputs.filter((c) => c.checked).length < 2;
      onChange();
    });
  }
  for (const el of [...daysModeInputs, ...coreModeInputs, ...levelInputs]) {
    el.addEventListener("change", onChange);
  }

  return { getState, resetControls };
}

export const search = {
  async init() {
    const statusAsOf = document.body.dataset.statusAsOf || "";
    const input = document.getElementById("search-input");
    const filtersContainer = document.getElementById("filters-body");
    let sections = [];
    let filters = null;

    // FR-10: clears the search box and every filter together, in one action.
    const clearAll = () => {
      input.value = "";
      filters.resetControls();
      applyFilter();
    };

    const applyFilter = () => {
      if (!filters) return; // Data hasn't loaded yet; load() applies the filter once it has.
      const state = { ...filters.getState(), terms: normalizeTerms(input.value) };
      const matched = sections.filter((section) => matchesFilters(section, state));
      renderResults(groupCourses(matched), matched.length, statusAsOf, clearAll);
    };

    // A schedule change (add, remove, swap, hide, or restore) changes the rows'
    // buttons and conflict notes.
    calendar.onChange(syncAllRows);

    // FR-41: loading and data-load-error states.
    const load = async () => {
      document.getElementById("results-list").hidden = true;
      document.getElementById("results-summary").hidden = true;
      setMessage("Loading classes…");
      try {
        const response = await fetch("/api/sections");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sections = (await response.json()).sections;
        calendar.setCatalog(sections);
        calendar.restore(); // FR-25: restores the saved schedule before the first render.
        filters = buildFilters(filtersContainer, sections, applyFilter, clearAll);
        applyFilter();
      } catch {
        setMessage("Couldn't load class data.", { label: "Retry", onClick: load });
      }
    };

    input.addEventListener("input", applyFilter);
    await load();
  },
  matchesQuery,
  matchesFilters,
};
