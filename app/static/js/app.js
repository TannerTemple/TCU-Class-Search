// Module stubs. Requirements are in docs/04-requirements.md.

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEVEL_BANDS = [
  // D-26, OQ-17: value, label, and the [min, max] catalog number range.
  ["10000-29999", "10000–29999", [10000, 29999]],
  ["30000-49999", "30000–49999", [30000, 49999]],
  ["50000-plus", "50000 and up", [50000, 99999]],
];

const CORE_CODES = [
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

const RESULTS_CHUNK_SIZE = 60;

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
  if (filters.core.size > 0) {
    const core = section.core_codes || [];
    if (!core.some((code) => filters.core.has(code))) return false;
  }
  const meetings = section.meetings || [];
  if (filters.days.size > 0) {
    if (meetings.length === 0) return false;
    if (!meetings.every((m) => m.days.every((d) => filters.days.has(d)))) return false;
  }
  if (filters.startFrom || filters.startTo) {
    const inRange = meetings.some(
      (m) =>
        (!filters.startFrom || m.start_time >= filters.startFrom) &&
        (!filters.startTo || m.start_time <= filters.startTo),
    );
    if (!inRange) return false;
  }
  return matchesQuery(section, filters.terms);
}

function appendChip(container, text, extraClass) {
  if (!text) return; // BR-18: fields with no value render nothing.
  const chip = document.createElement("span");
  chip.className = extraClass ? `chip ${extraClass}` : "chip";
  chip.textContent = text;
  container.appendChild(chip);
}

// FR-11: course code and title first, section, session if not REG, component label,
// days/times, Core codes, instruction mode if not In Person, status chip, and Add.
function buildRow(section, statusAsOf) {
  const li = document.createElement("li");
  li.className = "result-row";

  const head = document.createElement("div");
  head.className = "result-head";
  const code = document.createElement("span");
  code.className = "course-code";
  code.textContent = section.course_code;
  const title = document.createElement("span");
  title.className = "course-title";
  title.textContent = section.title;
  head.append(code, title);

  const meta = document.createElement("div");
  meta.className = "result-meta";
  appendChip(meta, `Section ${section.section}`);
  if (section.session_code !== "REG") {
    appendChip(meta, section.session_name || section.session_code);
  }
  appendChip(meta, section.component_label || section.component_type);
  for (const meeting of section.meetings || []) {
    appendChip(meta, meeting.text);
  }
  for (const coreCode of section.core_codes || []) {
    appendChip(meta, coreCode, "core-chip");
  }
  if (section.instruction_mode !== "In Person") {
    appendChip(meta, section.instruction_mode);
  }
  appendChip(
    meta,
    `${section.status} as of ${statusAsOf}`,
    section.status === "Open" ? "status-chip status-open" : "status-chip status-closed",
  );

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-btn";
  addButton.textContent = "Add";
  addButton.setAttribute("aria-pressed", "false");
  // Visual toggle only, per the row behavior in docs/07-ui-spec.md. Wiring this
  // button to the schedule is FR-16, which lands with the calendar (#11).
  addButton.addEventListener("click", () => {
    const added = addButton.getAttribute("aria-pressed") === "true";
    addButton.setAttribute("aria-pressed", String(!added));
    addButton.textContent = added ? "Add" : "Added ✓";
  });

  li.append(head, meta, addButton);
  return li;
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

// FR-41, NFR-01: no-results state with a clear action; long lists render incrementally
// so a filter change stays responsive instead of building up to 3,926 rows at once.
let renderToken = 0;

function renderResults(sections, statusAsOf, onClear) {
  const token = ++renderToken;
  const list = document.getElementById("results-list");
  list.textContent = "";

  if (sections.length === 0) {
    list.hidden = true;
    setMessage("No classes match your search and filters.", {
      label: "Clear all",
      onClick: onClear,
    });
    return;
  }

  list.hidden = false;
  hideMessage();

  let index = 0;
  const renderChunk = () => {
    if (token !== renderToken) return; // Superseded by a later search or filter change.
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + RESULTS_CHUNK_SIZE, sections.length);
    for (; index < end; index += 1) {
      fragment.appendChild(buildRow(sections[index], statusAsOf));
    }
    list.appendChild(fragment);
    if (index < sections.length) {
      // setTimeout, not requestAnimationFrame: rAF is paused on a hidden/background tab,
      // which would stall the render indefinitely instead of just finishing unseen.
      setTimeout(renderChunk, 0);
    }
  };
  renderChunk();
}

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

function createOptionRow(type, name, value, text, checked, className) {
  const row = document.createElement("label");
  row.className = "filter-option";
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value;
  input.checked = checked;
  if (className) input.className = className;
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

// FR-02 to FR-09: build every filter control from the loaded data, then re-filter on change.
function buildFilters(container, sections, onChange, onClearAll) {
  container.textContent = "";
  const dayInputs = [];
  const coreInputs = [];

  const { wrapper: subjectWrap, select: subjectSelect } = createSelect(
    "filter-subject",
    "Subject",
    "All subjects",
    distinctSorted(sections, (s) => s.subject).map((s) => [s, s]),
  );

  const daysFieldset = createFieldset("Days");
  for (const day of DAY_ORDER) {
    const { row, input } = createOptionRow("checkbox", "filter-day", day, day, false);
    dayInputs.push(input);
    daysFieldset.append(row);
  }

  const timeWrap = document.createElement("div");
  timeWrap.className = "filter-group";
  const timeLabel = document.createElement("span");
  timeLabel.textContent = "Start time";
  const startFrom = document.createElement("input");
  startFrom.type = "time";
  startFrom.id = "filter-start-from";
  startFrom.setAttribute("aria-label", "Earliest start time");
  const startTo = document.createElement("input");
  startTo.type = "time";
  startTo.id = "filter-start-to";
  startTo.setAttribute("aria-label", "Latest start time");
  timeWrap.append(timeLabel, startFrom, document.createTextNode(" to "), startTo);

  const statusFieldset = createFieldset("Status");
  const statusInputs = [];
  for (const [value, text] of [
    ["", "Any"],
    ["Open", "Open"],
    ["Closed", "Closed"],
  ]) {
    const { row, input } = createOptionRow(
      "radio",
      "filter-status",
      value,
      text,
      value === "",
    );
    statusInputs.push(input);
    statusFieldset.append(row);
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

  const coreFieldset = createFieldset("Core curriculum");
  for (const [code, name] of CORE_CODES) {
    const { row, input } = createOptionRow(
      "checkbox",
      "filter-core",
      code,
      `${name} (${code})`,
      false,
    );
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
    daysFieldset,
    timeWrap,
    statusFieldset,
    sessionWrap,
    modeWrap,
    levelFieldset,
    coreFieldset,
    clearButton,
  );

  const getState = () => ({
    subject: subjectSelect.value || null,
    days: new Set(dayInputs.filter((el) => el.checked).map((el) => el.value)),
    startFrom: startFrom.value || null,
    startTo: startTo.value || null,
    status: (statusInputs.find((el) => el.checked) || {}).value || null,
    session: sessionSelect.value || null,
    mode: modeSelect.value || null,
    level: (() => {
      const value = (levelInputs.find((el) => el.checked) || {}).value;
      const band = LEVEL_BANDS.find(([v]) => v === value);
      return band ? band[2] : null;
    })(),
    core: new Set(coreInputs.filter((el) => el.checked).map((el) => el.value)),
  });

  // FR-10: resets every filter control. The search box is cleared separately by the
  // caller (search.init), since the box lives outside this panel.
  const resetControls = () => {
    subjectSelect.value = "";
    sessionSelect.value = "";
    modeSelect.value = "";
    startFrom.value = "";
    startTo.value = "";
    for (const el of dayInputs) el.checked = false;
    for (const el of coreInputs) el.checked = false;
    statusInputs[0].checked = true;
    levelInputs[0].checked = true;
  };
  clearButton.addEventListener("click", onClearAll);

  for (const el of [subjectSelect, sessionSelect, modeSelect]) {
    el.addEventListener("change", onChange);
  }
  for (const el of [startFrom, startTo]) {
    el.addEventListener("input", onChange);
  }
  for (const el of [...dayInputs, ...coreInputs, ...statusInputs, ...levelInputs]) {
    el.addEventListener("change", onChange);
  }

  return { getState, resetControls };
}

export const search = {
  // FR-01 to FR-10: fetch the sections payload once, then filter in the browser (D-19).
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
      const terms = normalizeTerms(input.value);
      const state = { ...filters.getState(), terms };
      renderResults(
        sections.filter((section) => matchesFilters(section, state)),
        statusAsOf,
        clearAll,
      );
    };

    // FR-41: loading and data-load-error states.
    const load = async () => {
      document.getElementById("results-list").hidden = true;
      setMessage("Loading classes…");
      try {
        const response = await fetch("/api/sections");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sections = (await response.json()).sections;
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

export const calendar = {
  // TODO FR-16 to FR-23: draw the weekly grid, conflicts, and the Unscheduled list.
};

export const storage = {
  key: "classify.schedule.v1",
  // TODO FR-24 to FR-26: save and restore class numbers and visibility flags only.
};

if (typeof document !== "undefined" && document.getElementById("search-input")) {
  search.init();
}
