// FR-34: on narrow screens the page becomes two tabs, Search and My schedule.
// Add shows a toast and raises the badge count on My schedule. On wider
// screens both panels show side by side and the tab roles are removed, so
// screen readers don't hear tabs that aren't there. NFR-03, NFR-04.
import * as calendar from "./calendar.js";

export const MOBILE_QUERY = "(max-width: 768px)";
const TOAST_MS = 3000;

// The badge's screen-reader text, e.g. "3 classes". Empty at 0, when the badge
// is hidden (BR-18).
export function badgeText(count) {
  if (count <= 0) return "";
  return count === 1 ? "1 class" : `${count} classes`;
}

export function addedToastText(section) {
  return `Added ${calendar.describeSection(section)} to My schedule`;
}

// WAI-ARIA tabs pattern: arrow keys move between tabs and wrap; Home and End
// jump to the ends. Returns null for any other key.
export function nextTabIndex(current, key, count) {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

function updateBadge() {
  const count = calendar.scheduledCount();
  const badge = document.getElementById("schedule-badge");
  const srText = document.getElementById("schedule-badge-text");
  if (!badge || !srText) return;
  badge.textContent = count > 0 ? String(count) : "";
  badge.hidden = count === 0;
  srText.textContent = count > 0 ? `, ${badgeText(count)}` : "";
}

let toastTimer = null;

function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  // The live region stays rendered; CSS collapses it while empty. A region that
  // is hidden and then shown often isn't announced.
  toast.textContent = text;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.textContent = "";
  }, TOAST_MS);
}

export function init() {
  const tabs = [...document.querySelectorAll(".mobile-tabs [data-panel]")];
  const panels = tabs.map((tab) => document.getElementById(tab.dataset.panel));
  if (tabs.length === 0 || panels.some((panel) => !panel)) return;
  const mobile = window.matchMedia(MOBILE_QUERY);
  let selected = 0;

  const apply = () => {
    tabs.forEach((tab, i) => {
      const isSelected = i === selected;
      const panel = panels[i];
      if (mobile.matches) {
        tab.setAttribute("aria-selected", String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.hidden = !isSelected;
      } else {
        panel.removeAttribute("role");
        panel.removeAttribute("aria-labelledby");
        panel.hidden = false;
      }
    });
  };

  const select = (index, moveFocus) => {
    selected = index;
    apply();
    // On My schedule the calendar shows the add itself, so drop a leftover toast.
    if (index === 1) {
      const toast = document.getElementById("toast");
      if (toast) toast.textContent = "";
    }
    if (moveFocus) tabs[index].focus();
    window.scrollTo({ top: 0 });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const next = nextTabIndex(i, event.key, tabs.length);
      if (next === null) return;
      event.preventDefault();
      select(next, true);
    });
  });
  mobile.addEventListener("change", apply);
  apply();

  // The skip link targets the search box, which is hidden on the schedule tab.
  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", () => {
      if (mobile.matches && selected !== 0) select(0, false);
    });
  }

  // Mobile only: the filter list is long, so it starts collapsed behind a button.
  const filters = document.getElementById("filters");
  const filtersToggle = document.getElementById("filters-toggle");
  if (filters && filtersToggle) {
    filtersToggle.addEventListener("click", () => {
      const open = filters.classList.toggle("filters-open");
      filtersToggle.setAttribute("aria-expanded", String(open));
      filtersToggle.textContent = open ? "Hide filters" : "Show filters";
    });
  }

  calendar.onChange((event) => {
    updateBadge();
    // The toast is for when the calendar isn't on screen to show the add.
    if (event && event.type === "add" && mobile.matches && selected !== 1) {
      showToast(addedToastText(event.section));
    }
  });
  updateBadge();
}
