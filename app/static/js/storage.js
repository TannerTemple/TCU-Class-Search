// FR-24 to FR-26: autosave the schedule in the browser and restore it on load.
// Stores only the term code, class numbers, and visibility flags (BR-12, BR-15,
// BR-17). Schedules never leave the browser (NFR-06).
const STORAGE_KEY = "classify.schedule.v1";
const PROBE_KEY = `${STORAGE_KEY}.probe`;
const VERSION = 1;

// items: [{class_nbr, visible}]
export function serialize(termCode, items) {
  return { version: VERSION, term_code: termCode, items };
}

// Returns the stored items for this term, or null if there's nothing usable:
// missing, corrupt, a different version, or a different term (FR-25, UC-07).
export function parse(raw, termCode) {
  if (!raw) return null;
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !payload ||
    payload.version !== VERSION ||
    payload.term_code !== termCode ||
    !Array.isArray(payload.items)
  ) {
    return null;
  }
  return payload.items.filter(
    (item) => item && typeof item.class_nbr === "string" && typeof item.visible === "boolean",
  );
}

export const storage = {
  key: STORAGE_KEY,

  // FR-26: true unless storage throws — full, disabled, or blocked by the browser.
  isAvailable() {
    try {
      window.localStorage.setItem(PROBE_KEY, "1");
      window.localStorage.removeItem(PROBE_KEY);
      return true;
    } catch {
      return false;
    }
  },

  save(termCode, items) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(termCode, items)));
      return true;
    } catch {
      return false;
    }
  },

  load(termCode) {
    try {
      return parse(window.localStorage.getItem(STORAGE_KEY), termCode);
    } catch {
      return null;
    }
  },
};
