import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

// The modules that build the shell can only be imported by a browser, so a
// mistyped path in one of them is a blank page rather than a failure here.
// A text scan reaches them: the specifiers are written, not computed. The one
// the stage builds at runtime is derived from ids, which the manifest checks.
test("every import specifier names a file that is there", () => {
  for (const file of allScripts()) {
    const source = readFileSync(`${root}${file}`, "utf8");
    for (const [, specifier] of source.matchAll(/\bfrom\s+"([^"]+)"/g)) {
      assert.ok(specifier.startsWith("."), `${file} imports "${specifier}", which is not relative`);
      const target = resolve(dirname(`${root}${file}`), specifier);
      assert.ok(exists(target), `${file} imports "${specifier}", which is missing`);
    }
  }
});

function allScripts(path = "") {
  return readdirSync(`${root}${path}`, { withFileTypes: true }).flatMap((entry) => {
    const child = path ? `${path}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return allScripts(child);
    return entry.name.endsWith(".js") ? [child] : [];
  });
}

function exists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
