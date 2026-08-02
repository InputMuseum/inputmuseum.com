import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATEGORIES, exhibitAsset } from "../../public/js/registry.js";

const root = fileURLToPath(new URL("../../public/", import.meta.url));
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
    const module = await import(
      `../../public/${exhibitAsset(categoryId, exhibitId, "exhibit.js")}`
    );
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
      const module = await import(
        `../../public/${exhibitAsset(category.id, exhibit.id, "exhibit.js")}`
      );
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

// The boundary is silent when it breaks: a note that lands inside the artifact
// is published at a URL, and nothing about the site stops working to say so.
test("no repository note sits inside the deploy artifact", () => {
  const strays = [];
  const walk = (path = "") => {
    for (const entry of readdirSync(at(path), { withFileTypes: true })) {
      const child = path ? `${path}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(child);
      else if (entry.name.endsWith(".md")) strays.push(child);
    }
  };
  walk();
  assert.deepEqual(strays, [], `${strays.join(", ")} would be served`);
});

// The rail is off-screen below this width and its links have to be made inert
// to match, which is the one piece of the layout the JS has to know about. The
// two halves are in different languages, so nothing else can notice a drift.
test("the narrow layout starts at the same width in the CSS and the JS", () => {
  const [, query] = readFileSync(at("js/dom.js"), "utf8").match(/matchMedia\("([^"]+)"\)/) ?? [];
  assert.ok(query, "js/dom.js declares the narrow media query");

  const stylesheets = readdirSync(at("css")).map((name) => readFileSync(at(`css/${name}`), "utf8"));
  assert.ok(
    stylesheets.some((css) => css.includes(`@media ${query}`)),
    `no stylesheet opens at ${query}`,
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

// The scan is the thing holding the scope rule up, so it is worth knowing that
// it reads what this repo writes — and, since it once refused a stylesheet that
// was never breaking the rule, what it must not object to.
test("the scan reads a stylesheet the way the rule means it", () => {
  assert.deepEqual(selectors("[data-exhibit] .a,\n[data-exhibit] .b {\n  color: red;\n}"), [
    "[data-exhibit] .a",
    "[data-exhibit] .b",
  ]);
  assert.deepEqual(
    selectors("@media (max-width: 1px) {\n  .inside {\n    color: red;\n  }\n}"),
    [".inside"],
    "a media query is descended into, since its rules are rules",
  );
  assert.deepEqual(
    selectors(
      "@keyframes spin {\n  from {\n    opacity: 0;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}",
    ),
    [],
    "a keyframe's steps are positions in an animation, not selectors",
  );
  assert.deepEqual(
    selectors("@keyframes spin {\n  to {\n    opacity: 1;\n  }\n}\n.after {\n  color: red;\n}"),
    [".after"],
    "and the scan picks up again after the block it skipped",
  );
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
    // A keyframe's steps are `from`, `to` and percentages — where a declaration
    // sits in an animation, not what it applies to, so there is nothing for the
    // scope rule to be true of and the whole block is stepped over.
    if (stripped[cursor] === "{" && prelude.startsWith("@keyframes")) {
      cursor = endOfBlock(stripped, cursor);
      start = cursor + 1;
      continue;
    }
    if (stripped[cursor] === "{" && prelude && !prelude.startsWith("@"))
      found.push(...prelude.split(",").map((one) => one.trim()));
    start = cursor + 1;
  }
  return found;
}

function endOfBlock(css, open) {
  let depth = 0;
  for (let at = open; at < css.length; at++) {
    if (css[at] === "{") depth++;
    else if (css[at] === "}" && --depth === 0) return at;
  }
  return css.length;
}
