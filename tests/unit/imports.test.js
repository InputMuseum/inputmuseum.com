import { test } from "node:test";
import assert from "node:assert/strict";

// The regression guard for the rest of the suite: these modules must never
// touch the DOM at import time, or nothing but a browser session would catch
// it and everything that tests them here would stop being testable. An
// exhibit belongs on this list too — it builds its DOM inside mount, so
// reaching for a shell element at the top of the file is the mistake.
const PURE = [
  "js/registry.js",
  "js/router.js",
  "js/session.js",
  "js/motion.js",
  "js/el.js",
  "exhibits/payment/form.js",
  "exhibits/payment/odometer/digits.js",
  "exhibits/payment/odometer/exhibit.js",
  "exhibits/payment/slot-machine/reels.js",
  "exhibits/payment/slot-machine/exhibit.js",
];

test("the DOM-free modules import in bare Node", async () => {
  for (const path of PURE) {
    const module = await import(`../../${path}`);
    assert.ok(Object.keys(module).length > 0, `${path} has exports`);
  }
});
