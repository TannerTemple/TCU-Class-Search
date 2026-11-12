// Course cards, credit hours (D-41), the day and start-time filters (FR-03,
// FR-04), and row actions with conflicts (FR-16, FR-18, FR-21). Pure
// functions, no DOM. Run with: node --test tests/js/*.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { addButtonState, computeRange, findAlternates } from "../../app/static/js/calendar.js";
import {
  creditHours,
  creditsText,
  groupCourses,
  matchesCore,
  matchesDays,
  matchesStart,
  meetingParts,
  sectionAction,
  totalCredits,
} from "../../app/static/js/courses.js";

function section(classNbr, overrides = {}) {
  return {
    class_nbr: classNbr,
    course_code: "ACCT 20353",
    catalog_nbr: "20353",
    title: "Fundamentals of Accounting",
    section: "002",
    component_type: "LEC",
    core_codes: [],
    start_date: "2027-01-19",
    meetings: [{ days: ["Mon", "Wed", "Fri"], start_time: "08:00", end_time: "08:50" }],
    ...overrides,
  };
}

const MWF_8 = section("1");
const MWF_9 = section("2", {
  section: "010",
  meetings: [{ days: ["Mon", "Wed", "Fri"], start_time: "09:00", end_time: "09:50" }],
});
const TR_8 = section("3", {
  course_code: "ECON 10223",
  catalog_nbr: "10223",
  title: "Intro Microeconomics",
  core_codes: ["SSC"],
  meetings: [{ days: ["Tue", "Thu"], start_time: "08:00", end_time: "09:20" }],
});
const MWF_8_OTHER = section("4", {
  course_code: "MATH 10524",
  catalog_nbr: "10524",
  title: "Calculus I",
});
const TBA = section("5", { course_code: "ACCT 40010", catalog_nbr: "40010", meetings: [] });
const EVENING = section("6", {
  meetings: [{ days: ["Tue"], start_time: "18:30", end_time: "21:00" }],
});

test("credit hours are the catalog number's last digit", () => {
  assert.equal(creditHours("20353"), 3);
  assert.equal(creditHours("20001"), 1);
  assert.equal(creditHours("10524"), 4);
});

test("a final 0 is variable credit, so there's no number to show", () => {
  assert.equal(creditHours("40010"), null);
});

test("credit hours need a 5-digit catalog number", () => {
  assert.equal(creditHours("2035"), null);
  assert.equal(creditHours(undefined), null);
});

test("groupCourses puts every section of a course on one card, in order", () => {
  const groups = groupCourses([MWF_8, TR_8, MWF_9]);
  assert.deepEqual(
    groups.map((g) => [g.course_code, g.sections.map((s) => s.class_nbr)]),
    [
      ["ACCT 20353", ["1", "2"]],
      ["ECON 10223", ["3"]],
    ],
  );
  assert.deepEqual(groups[1].core_codes, ["SSC"]);
});

test("groupCourses keeps topic titles under one course code apart", () => {
  const a = section("7", { course_code: "ARST 40970", title: "Special Problems - Ceramics" });
  const b = section("8", { course_code: "ARST 40970", title: "Special Problems - Painting" });
  assert.equal(groupCourses([a, b]).length, 2);
});

test("selecting Tue includes Tue/Thu classes by default", () => {
  assert.equal(matchesDays(TR_8, new Set(["Tue"])), true);
  assert.equal(matchesDays(MWF_8, new Set(["Tue"])), false);
});

test("'only' mode needs every meeting day selected", () => {
  assert.equal(matchesDays(TR_8, new Set(["Tue"]), "only"), false);
  assert.equal(matchesDays(TR_8, new Set(["Tue", "Thu"]), "only"), true);
  assert.equal(matchesDays(MWF_8, new Set(["Mon", "Wed", "Fri", "Tue"]), "only"), true);
});

test("a section with no set time never matches a day filter", () => {
  assert.equal(matchesDays(TBA, new Set(["Mon"])), false);
  assert.equal(matchesDays(TBA, new Set()), true);
});

test("start-time chips match the band a meeting starts in", () => {
  assert.equal(matchesStart(MWF_8, new Set(["morning"]), null), true);
  assert.equal(matchesStart(MWF_8, new Set(["afternoon"]), null), false);
  assert.equal(matchesStart(EVENING, new Set(["evening"]), null), true);
  assert.equal(matchesStart(EVENING, new Set(["morning", "afternoon"]), null), false);
});

test("an exact range is inclusive and open-ended on a null side", () => {
  assert.equal(matchesStart(MWF_9, new Set(), { from: "09:00", to: "11:00" }), true);
  assert.equal(matchesStart(MWF_8, new Set(), { from: "09:00", to: null }), false);
  assert.equal(matchesStart(EVENING, new Set(), { from: null, to: "18:30" }), true);
});

test("a start-time filter skips sections with no set time", () => {
  assert.equal(matchesStart(TBA, new Set(["morning"]), null), false);
  assert.equal(matchesStart(TBA, new Set(), null), true);
});

test("sectionAction: Add, Added, and a conflict that doesn't block", () => {
  assert.equal(sectionAction(MWF_8, []).kind, "add");
  assert.equal(sectionAction(MWF_8, [{ section: MWF_8, hidden: false }]).kind, "added");
  const clash = sectionAction(MWF_8_OTHER, [{ section: MWF_8, hidden: false }]);
  assert.equal(clash.kind, "add");
  assert.deepEqual(clash.conflicts, [MWF_8]);
});

test("sectionAction offers Switch for another section of a scheduled course", () => {
  const action = sectionAction(MWF_9, [{ section: MWF_8, hidden: false }]);
  assert.equal(action.kind, "switch");
  assert.equal(action.replaces, MWF_8);
});

test("the section being switched out isn't a conflict, but other classes are", () => {
  const sameTime = section("9", { section: "020" });
  const action = sectionAction(sameTime, [
    { section: MWF_8, hidden: false },
    { section: MWF_8_OTHER, hidden: false },
  ]);
  assert.equal(action.kind, "switch");
  assert.deepEqual(action.conflicts, [MWF_8_OTHER]);
});

test("hidden sections don't count as conflicts (FR-19)", () => {
  assert.deepEqual(sectionAction(MWF_8_OTHER, [{ section: MWF_8, hidden: true }]).conflicts, []);
});

test("totalCredits counts each course once and skips hidden backups", () => {
  const total = totalCredits([
    { section: MWF_8, hidden: false },
    { section: MWF_9, hidden: false },
    { section: TR_8, hidden: false },
    { section: MWF_8_OTHER, hidden: true },
  ]);
  assert.deepEqual(total, { hours: 6, variable: 0 });
});

test("variable-credit courses are named, not summed", () => {
  const total = totalCredits([
    { section: MWF_8, hidden: false },
    { section: TBA, hidden: false },
  ]);
  assert.deepEqual(total, { hours: 3, variable: 1 });
  assert.equal(creditsText(total), "3 credit hours + variable");
  assert.equal(creditsText({ hours: 1, variable: 0 }), "1 credit hour");
});

test("the button offers Switch with a name that starts with its text (NFR-04)", () => {
  const state = addButtonState(false, "ACCT 20353 section 010", "switch");
  assert.equal(state.text, "Switch");
  assert.ok(state.ariaLabel.startsWith("Switch"));
  assert.equal(state.ariaDisabled, "false");
});

test("the grid defaults to Mon–Fri, 8 AM–6 PM, and expands when needed (FR-20)", () => {
  assert.deepEqual(computeRange([]), {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startHour: 8,
    endHour: 18,
  });
  const range = computeRange([EVENING, section("10", { meetings: [{ days: ["Sat"], start_time: "07:00", end_time: "08:00" }] })]);
  assert.equal(range.startHour, 7);
  assert.equal(range.endHour, 21);
  assert.ok(range.days.includes("Sat"));
});

test("findAlternates keeps to the same topic title", () => {
  const a = section("11", { course_code: "ARST 40970", title: "Special Problems - Ceramics" });
  const b = section("12", { course_code: "ARST 40970", title: "Special Problems - Painting" });
  const c = section("13", { course_code: "ARST 40970", title: "Special Problems - Ceramics" });
  assert.deepEqual(findAlternates(a, [a, b, c]), [c]);
});

test("meetingParts splits days from hours without reformatting either", () => {
  assert.deepEqual(meetingParts("Mon, Wed, Fri · 9:00–9:50 AM"), ["Mon, Wed, Fri", "9:00–9:50 AM"]);
  assert.deepEqual(meetingParts("No separator"), ["No separator", ""]);
});

test("Core 'any' matches a section with either code; 'all' needs both (FR-09)", () => {
  const both = section("20", { core_codes: ["CA", "GA"] });
  const caOnly = section("21", { core_codes: ["CA"] });
  const none = section("22", { core_codes: [] });
  const picked = new Set(["CA", "GA"]);
  assert.equal(matchesCore(both, picked), true);
  assert.equal(matchesCore(caOnly, picked), true);
  assert.equal(matchesCore(none, picked), false);
  assert.equal(matchesCore(both, picked, "all"), true);
  assert.equal(matchesCore(caOnly, picked, "all"), false);
  assert.equal(matchesCore(none, new Set()), true);
});
