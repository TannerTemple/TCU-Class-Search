// Entry point. Requirements are in docs/04-requirements.md.
import * as calendar from "./calendar.js";
import * as mobile from "./mobile.js";
import * as popup from "./popup.js";
import { search } from "./search.js";
import { storage } from "./storage.js";

export { search, calendar, storage, popup, mobile };

if (typeof document !== "undefined" && document.getElementById("search-input")) {
  calendar.init();
  mobile.init(); // Before search.init, so the badge sees the restored schedule.
  search.init();
}
