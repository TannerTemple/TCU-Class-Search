// FR-14: a same-page pop-up showing every non-empty field, the class number
// with a copy button (FR-15), a lab hint (FR-42), and the incomplete-times note
// (FR-43). FR-33: instructor and RMP link for showcase classes only. NFR-04:
// traps focus while open, closes on Esc or an outside click, and returns focus
// to the row that opened it.
import * as calendar from "./calendar.js";
import { copyClassNumber } from "./clipboard.js";

const PERMIT_DETAIL = {
  DeptPermit: "Department permit required",
  InstrPermit: "Instructor permit required",
};

const FOCUSABLE_SELECTOR = 'button, a[href], select, input, [tabindex]:not([tabindex="-1"])';

let openerElement = null;
let onKeydown = null;

function root() {
  return document.getElementById("popup-root");
}

function addField(dl, label, value) {
  if (value === null || value === undefined || value === "") return; // BR-18
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  dl.append(dt, dd);
}

function statusText(section) {
  const statusAsOf = document.body?.dataset.statusAsOf || "";
  let text = `${section.status} as of ${statusAsOf}`;
  const detail = PERMIT_DETAIL[section.status_detail];
  if (detail) text += ` · ${detail}`;
  return text;
}

function meetingsText(section) {
  return section.meetings.length > 0
    ? section.meetings.map((m) => m.text).join("; ")
    : "No set meeting time";
}

function buildCopyRow(classNbr) {
  const row = document.createElement("div");
  row.className = "popup-class-nbr";
  const label = document.createElement("span");
  label.textContent = `Class number: ${classNbr}`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-btn";
  button.textContent = "Copy";
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
  row.append(label, button, feedback);
  return row;
}

// FR-42: offers to show the labs a course lists, without adding any of them
// automatically (D-32).
function buildLabsHint(section) {
  const labs = calendar.findLabs(section, calendar.getCatalog());
  if (labs.length === 0) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "popup-labs";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "message-action";
  const plural = labs.length === 1 ? "" : "s";
  toggle.textContent = `This course also lists ${labs.length} lab section${plural}`;

  const list = document.createElement("ul");
  list.className = "popup-labs-list";
  list.hidden = true;
  for (const lab of labs) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `Section ${lab.section} · ${meetingsText(lab)}`;
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-btn";
    const scheduled = calendar.isScheduled(lab.class_nbr);
    addButton.textContent = scheduled ? "Added ✓" : "Add";
    addButton.disabled = scheduled;
    addButton.addEventListener("click", () => {
      calendar.addSection(lab);
      addButton.textContent = "Added ✓";
      addButton.disabled = true;
    });
    item.append(label, addButton);
    list.append(item);
  }
  toggle.addEventListener("click", () => {
    list.hidden = !list.hidden;
  });
  wrapper.append(toggle, list);
  return wrapper;
}

function buildAddRemoveButton(section) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-btn";
  const refresh = () => {
    button.textContent = calendar.isScheduled(section.class_nbr) ? "Remove" : "Add";
  };
  refresh();
  button.addEventListener("click", () => {
    if (calendar.isScheduled(section.class_nbr)) {
      calendar.removeSection(section.class_nbr);
    } else {
      calendar.addSection(section);
    }
    refresh();
  });
  return button;
}

function buildContent(section) {
  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const heading = document.createElement("h2");
  heading.id = "popup-heading";
  heading.textContent = `${section.course_code} — ${section.title}`;
  wrapper.append(heading, buildCopyRow(section.class_nbr));

  const dl = document.createElement("dl");
  dl.className = "popup-fields";
  addField(dl, "Section", section.section);
  addField(dl, "Component", section.component_label || section.component_type);
  addField(dl, "Session", section.session_name || section.session_code);
  addField(dl, "Starts", section.start_date_display);
  addField(dl, "Meets", meetingsText(section));
  addField(dl, "Instruction mode", section.instruction_mode);
  if (section.core_codes && section.core_codes.length > 0) {
    addField(dl, "Core", section.core_codes.join(", "));
  }
  addField(dl, "Status", statusText(section));
  addField(dl, "Enrollment limit", section.enroll_max != null ? String(section.enroll_max) : null);
  addField(dl, "Reserve limit", section.rsv_max != null ? String(section.rsv_max) : null);
  addField(dl, "Waitlist limit", section.wait_max != null ? String(section.wait_max) : null);
  wrapper.append(dl);

  // FR-43.
  if (section.meetings_may_be_incomplete) {
    const note = document.createElement("p");
    note.className = "chip incomplete-chip";
    note.textContent = "Meeting times may be incomplete. Check classes.tcu.edu.";
    wrapper.append(note);
  }

  const labsHint = buildLabsHint(section);
  if (labsHint) wrapper.append(labsHint);

  // D-24.
  if (section.course_description_url) {
    const link = document.createElement("a");
    link.href = section.course_description_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Course description (TCU) ↗";
    wrapper.append(link);
  }

  // FR-33: showcase classes only (D-12).
  if (section.instructor_name) {
    const instructor = document.createElement("p");
    instructor.textContent = `Instructor: ${section.instructor_name}`;
    wrapper.append(instructor);
    if (section.rmp_url) {
      const rmpLink = document.createElement("a");
      rmpLink.href = section.rmp_url;
      rmpLink.target = "_blank";
      rmpLink.rel = "noopener noreferrer";
      rmpLink.textContent = "Rate My Professor ↗";
      wrapper.append(rmpLink);
    }
  }

  wrapper.append(buildAddRemoveButton(section));
  return wrapper;
}

// NFR-04: traps focus, closes on Esc or an outside click, and returns focus to
// the row that opened it.
export function open(section, opener) {
  const container = root();
  if (!container) return;
  openerElement = opener || document.activeElement;

  container.textContent = "";
  const backdrop = document.createElement("div");
  backdrop.className = "popup-backdrop";
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });

  const dialog = document.createElement("div");
  dialog.className = "popup-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "popup-heading");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "popup-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", close);

  dialog.append(closeButton, buildContent(section));
  backdrop.append(dialog);
  container.append(backdrop);
  container.hidden = false;

  onKeydown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", onKeydown);

  closeButton.focus();
}

export function close() {
  const container = root();
  if (!container || container.hidden) return;
  container.textContent = "";
  container.hidden = true;
  if (onKeydown) document.removeEventListener("keydown", onKeydown);
  onKeydown = null;
  if (openerElement && typeof openerElement.focus === "function") {
    openerElement.focus();
  }
  openerElement = null;
}
