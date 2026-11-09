// FR-24, FR-25: the on-disk schedule shape (version, term code, class numbers,
// and visibility flags only — BR-12, BR-15, BR-17). Run with: node --test tests/js
import assert from "node:assert/strict";
import { test } from "node:test";

import { parse, serialize } from "../../app/static/js/storage.js";

test("serialize wraps items with a version and term code", () => {
  const items = [{ class_nbr: "34429", visible: true }];
  assert.deepEqual(serialize("4273", items), { version: 1, term_code: "4273", items });
});

test("parse round-trips what serialize produced", () => {
  const items = [
    { class_nbr: "34429", visible: true },
    { class_nbr: "30612", visible: false },
  ];
  const raw = JSON.stringify(serialize("4273", items));
  assert.deepEqual(parse(raw, "4273"), items);
});

test("parse returns null for a saved schedule from another term", () => {
  const raw = JSON.stringify(serialize("4273", []));
  assert.equal(parse(raw, "9999"), null);
});

test("parse returns null for an unknown version", () => {
  const raw = JSON.stringify({ version: 2, term_code: "4273", items: [] });
  assert.equal(parse(raw, "4273"), null);
});

test("parse returns null for corrupt JSON", () => {
  assert.equal(parse("not json", "4273"), null);
});

test("parse returns null when nothing is stored", () => {
  assert.equal(parse(null, "4273"), null);
  assert.equal(parse("", "4273"), null);
});

test("parse drops malformed items but keeps well-formed ones", () => {
  const raw = JSON.stringify({
    version: 1,
    term_code: "4273",
    items: [{ class_nbr: "34429", visible: true }, { class_nbr: 123, visible: true }, {}],
  });
  assert.deepEqual(parse(raw, "4273"), [{ class_nbr: "34429", visible: true }]);
});
