import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATEGORIES, isBuilt } from "../../public/js/registry.js";

// The regression guard for the rest of the suite: these modules must never
// touch the DOM at import time, or nothing but a browser session would catch
// it and everything that tests them here would stop being testable. An
// exhibit belongs on this list too — it builds its DOM inside mount, so
// reaching for a shell element at the top of the file is the mistake.
const SHELL = ["js/registry.js", "js/router.js", "js/session.js", "js/motion.js", "js/el.js"];

const root = fileURLToPath(new URL("../../public/", import.meta.url));

const scripts = (path) =>
  readdirSync(`${root}${path}`, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => `${path}/${entry.name}`);

// Read off the catalogue rather than written out, so an exhibit is held to
// this from the day it is listed rather than the day someone remembers it.
const EXHIBITS = CATEGORIES.filter(isBuilt).flatMap((category) => [
  ...scripts(`exhibits/${category.id}`),
  ...category.exhibits
    .filter((exhibit) => !exhibit.soon)
    .flatMap((exhibit) => scripts(`exhibits/${category.id}/${exhibit.id}`)),
]);

test("the DOM-free modules import in bare Node", async () => {
  for (const path of [...SHELL, ...EXHIBITS]) {
    const module = await import(`../../public/${path}`);
    assert.ok(Object.keys(module).length > 0, `${path} has exports`);
  }
});
