// Module stubs. Requirements are in docs/04-requirements.md.

function normalizeTerms(query) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// FR-01: matches subject, course number, and title, case-insensitively.
function matchesQuery(section, terms) {
  if (terms.length === 0) return true;
  const haystack = `${section.course_code} ${section.title}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
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

// FR-41: no-results state with a clear action.
function renderResults(sections, statusAsOf, onClear) {
  const list = document.getElementById("results-list");
  list.textContent = "";
  if (sections.length === 0) {
    list.hidden = true;
    setMessage("No classes match your search.", { label: "Clear search", onClick: onClear });
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const section of sections) {
    fragment.appendChild(buildRow(section, statusAsOf));
  }
  list.appendChild(fragment);
  list.hidden = false;
  hideMessage();
}

export const search = {
  // FR-01 to FR-10: fetch the sections payload once, then filter in the browser (D-19).
  async init() {
    const statusAsOf = document.body.dataset.statusAsOf || "";
    const input = document.getElementById("search-input");
    let sections = [];

    const clear = () => {
      input.value = "";
      applyFilter();
    };

    const applyFilter = () => {
      const terms = normalizeTerms(input.value);
      renderResults(
        sections.filter((section) => matchesQuery(section, terms)),
        statusAsOf,
        clear,
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
        applyFilter();
      } catch {
        setMessage("Couldn't load class data.", { label: "Retry", onClick: load });
      }
    };

    input.addEventListener("input", applyFilter);
    await load();
  },
  matchesQuery,
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
