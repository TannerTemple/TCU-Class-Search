// BR-08 conflict rule, verified against the shared fixture used by the Python
// version (D-20). Run with: node --test tests/js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { sectionsConflict } from "../../app/static/js/conflicts.js";

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/conflict_cases.json");
const cases = JSON.parse(readFileSync(fixturePath, "utf-8"));

for (const { name, a, b, conflict } of cases) {
  test(name, () => {
    assert.equal(sectionsConflict(a, b), conflict);
    assert.equal(sectionsConflict(b, a), conflict); // Symmetric.
  });
}
