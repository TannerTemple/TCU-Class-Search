// FR-34: the mobile tabs, badge, and toast text, and the Add button state
// (FR-16, NFR-04). Pure functions, no DOM. Run with: node --test tests/js/*.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { addButtonState, describeSection } from "../../app/static/js/calendar.js";
import { addedToastText, badgeText, nextTabIndex } from "../../app/static/js/mobile.js";

const SECTION = { class_nbr: "31705", course_code: "ECON 10223", section: "010" };

test("badgeText is empty at zero, so no badge shows (BR-18)", () => {
  assert.equal(badgeText(0), "");
});

test("badgeText counts one class, then many", () => {
  assert.equal(badgeText(1), "1 class");
  assert.equal(badgeText(2), "2 classes");
});

test("the toast names the class that was added", () => {
  assert.equal(addedToastText(SECTION), "Added ECON 10223 section 010 to My schedule");
});

test("arrow keys move between tabs and wrap", () => {
  assert.equal(nextTabIndex(0, "ArrowRight", 2), 1);
  assert.equal(nextTabIndex(1, "ArrowRight", 2), 0);
  assert.equal(nextTabIndex(0, "ArrowLeft", 2), 1);
});

test("Home and End jump to the first and last tab; other keys do nothing", () => {
  assert.equal(nextTabIndex(1, "Home", 2), 0);
  assert.equal(nextTabIndex(0, "End", 2), 1);
  assert.equal(nextTabIndex(0, "Enter", 2), null);
});

test("an unscheduled section's button reads Add and names the class", () => {
  const state = addButtonState(false, describeSection(SECTION));
  assert.deepEqual(state, {
    text: "Add",
    ariaLabel: "Add ECON 10223 section 010",
    ariaDisabled: "false",
  });
});

test("a scheduled section's button reads Added ✓ and stays focusable (aria-disabled)", () => {
  const state = addButtonState(true, describeSection(SECTION));
  assert.equal(state.text, "Added ✓");
  assert.ok(state.ariaLabel.startsWith("Added"), "accessible name starts with the visible text");
  assert.equal(state.ariaDisabled, "true");
});
