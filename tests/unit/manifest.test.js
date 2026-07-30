import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATEGORIES, exhibitAsset } from "../../js/registry.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const at = (path) => `${root}${path}`;
const exists = (path) => {
  try {
    return statSync(at(path)).isFile() || statSync(at(path)).isDirectory();
  } catch {
    return false;
  }
};
const dirs = (path) =>
  readdirSync(at(path), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const built = CATEGORIES.flatMap((category) =>
  category.exhibits
    .filter((exhibit) => !exhibit.soon)
    .map((exhibit) => ({ categoryId: category.id, exhibitId: exhibit.id })),
);

test("every built exhibit has the two files the stage loads", () => {
  for (const { categoryId, exhibitId } of built)
    for (const file of ["exhibit.js", "exhibit.css"]) {
      const path = exhibitAsset(categoryId, exhibitId, file);
      assert.ok(exists(path), `${path} is missing`);
    }
});

test("every built exhibit exports the contract the stage calls", async () => {
  for (const { categoryId, exhibitId } of built) {
    const module = await import(`../../${exhibitAsset(categoryId, exhibitId, "exhibit.js")}`);
    assert.ok(Array.isArray(module.fields), `${exhibitId} exports a fields array`);
    assert.ok(module.fields.length > 0, `${exhibitId} captures at least one field`);
    assert.equal(typeof module.mount, "function", `${exhibitId} exports mount`);
    for (const field of module.fields) {
      assert.equal(typeof field.name, "string");
      assert.equal(typeof field.label, "string");
    }
  }
});

// A category is a form and its exhibits are competing designs for the whole of
// it, which is only true while they all capture the same thing.
test("every exhibit in a category captures the same form", async () => {
  for (const category of CATEGORIES) {
    const rosters = [];
    for (const exhibit of category.exhibits.filter((entry) => !entry.soon)) {
      const module = await import(`../../${exhibitAsset(category.id, exhibit.id, "exhibit.js")}`);
      rosters.push([exhibit.id, module.fields]);
    }
    const [firstId, first] = rosters[0] ?? [];
    for (const [id, roster] of rosters.slice(1))
      assert.deepEqual(roster, first, `${id} captures a different form from ${firstId}`);
  }
});

test("an exhibit marked soon has nothing on disk yet", () => {
  for (const category of CATEGORIES)
    for (const exhibit of category.exhibits.filter((entry) => entry.soon)) {
      const path = `exhibits/${category.id}/${exhibit.id}`;
      assert.ok(!exists(path), `${path} exists, so the entry should lose its soon flag`);
    }
});

test("nothing sits under exhibits/ that the registry doesn't list", () => {
  const listed = new Set(built.map(({ categoryId, exhibitId }) => `${categoryId}/${exhibitId}`));
  for (const categoryId of dirs("exhibits"))
    for (const exhibitId of dirs(`exhibits/${categoryId}`))
      assert.ok(
        listed.has(`${categoryId}/${exhibitId}`),
        `exhibits/${categoryId}/${exhibitId} has no registry entry`,
      );
});

test("every exhibit rule is scoped to its own exhibit", () => {
  for (const { categoryId, exhibitId } of built) {
    const scope = `[data-exhibit="${categoryId}/${exhibitId}"]`;
    const css = readFileSync(at(exhibitAsset(categoryId, exhibitId, "exhibit.css")), "utf8");
    for (const selector of selectors(css))
      assert.ok(selector.startsWith(scope), `${exhibitId}: "${selector}" escapes ${scope}`);
  }
});

// A text scan rather than a parser: it only has to be right about stylesheets
// written the way this repo writes them, and loud when one isn't.
function selectors(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [];
  let start = 0;
  for (let cursor = 0; cursor < stripped.length; cursor++) {
    if (stripped[cursor] !== "{" && stripped[cursor] !== "}") continue;
    const prelude = stripped.slice(start, cursor).trim();
    if (stripped[cursor] === "{" && prelude && !prelude.startsWith("@"))
      found.push(...prelude.split(",").map((one) => one.trim()));
    start = cursor + 1;
  }
  return found;
}
