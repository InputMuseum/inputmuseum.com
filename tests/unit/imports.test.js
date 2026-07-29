import { test } from "node:test";
import assert from "node:assert/strict";

// The regression guard for the rest of the suite: these modules must never
// touch the DOM at import time, or nothing but a browser session would catch
// it and everything that tests them here would stop being testable.
const PURE = [
  "js/registry.js",
  "js/router.js",
  "js/session.js",
  "js/motion.js",
  "exhibits/payment/odometer/digits.js",
];

test("the DOM-free modules import in bare Node", async () => {
  for (const path of PURE) {
    const module = await import(`../../${path}`);
    assert.ok(Object.keys(module).length > 0, `${path} has exports`);
  }
});
