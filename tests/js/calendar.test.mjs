// FR-18, FR-42: finding swap alternates and the labs a course lists. Both are
// pure lookups over the catalog, no DOM involved. Run with: node --test tests/js/*.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { findAlternates, findLabs } from "../../app/static/js/calendar.js";

const LECTURE_A = { class_nbr: "1", course_code: "BIOL 10003", component_type: "LEC" };
const LECTURE_B = { class_nbr: "2", course_code: "BIOL 10003", component_type: "LEC" };
const LAB_A = { class_nbr: "3", course_code: "BIOL 10003", component_type: "LAB" };
const LAB_B = { class_nbr: "4", course_code: "BIOL 10003", component_type: "LAB" };
const OTHER_COURSE_LAB = { class_nbr: "5", course_code: "CHEM 10213", component_type: "LAB" };
const catalog = [LECTURE_A, LECTURE_B, LAB_A, LAB_B, OTHER_COURSE_LAB];

test("findAlternates matches the same course and component, excluding itself", () => {
  assert.deepEqual(findAlternates(LECTURE_A, catalog), [LECTURE_B]);
  assert.deepEqual(findAlternates(LAB_A, catalog), [LAB_B]);
});

test("findAlternates is empty when no other section of that course and component exists", () => {
  assert.deepEqual(findAlternates(OTHER_COURSE_LAB, catalog), []);
});

test("findLabs returns every other LAB section of the course", () => {
  assert.deepEqual(findLabs(LECTURE_A, catalog), [LAB_A, LAB_B]);
});

test("findLabs excludes a LAB section's own listing of itself", () => {
  assert.deepEqual(findLabs(LAB_A, catalog), [LAB_B]);
});

test("findLabs is empty when the course lists no labs", () => {
  assert.deepEqual(findLabs(OTHER_COURSE_LAB, catalog), []);
});
