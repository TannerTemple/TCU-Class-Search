// Browser version of the BR-08 conflict rule. app/conflicts.py is the reference;
// both must pass tests/fixtures/conflict_cases.json (D-20). Schedules never leave
// the browser (NFR-06), so this has to run here, not through the API.

const FAR_FUTURE = "9999-12-31"; // BR-08: an unknown end date counts as overlapping.

function daysShared(first, second) {
  const secondDays = new Set(second.days);
  return first.days.some((day) => secondDays.has(day));
}

function timesOverlap(first, second) {
  return first.start_time < second.end_time && second.start_time < first.end_time;
}

function meetingsOverlap(first, second) {
  return daysShared(first, second) && timesOverlap(first, second);
}

function dateRangesOverlap(first, second) {
  const firstEnd = first.end_date || FAR_FUTURE;
  const secondEnd = second.end_date || FAR_FUTURE;
  return first.start_date <= secondEnd && second.start_date <= firstEnd;
}

// True if the sections share a day, overlap in time, and overlap in date range.
// A missing end date counts as overlapping (BR-08). Touching times, where one
// meeting ends exactly when the other starts, don't overlap.
export function sectionsConflict(first, second) {
  if (!dateRangesOverlap(first, second)) return false;
  const firstMeetings = first.meetings || [];
  const secondMeetings = second.meetings || [];
  return firstMeetings.some((a) => secondMeetings.some((b) => meetingsOverlap(a, b)));
}
