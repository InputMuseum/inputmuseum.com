import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  exhibitAsset,
  isBuilt,
  lookup,
  openingRoute,
} from "../../public/js/registry.js";
import { parseRoute } from "../../public/js/router.js";

const every = CATEGORIES.flatMap((category) =>
  category.exhibits.map((exhibit) => ({ category, exhibit })),
);
const built = every.filter(({ exhibit }) => !exhibit.soon);

test("every id is unique and safe to put in a URL", () => {
  const ids = [...CATEGORIES.map((c) => c.id), ...every.map(({ exhibit }) => exhibit.id)];
  for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, id);

  for (const category of CATEGORIES) {
    const within = category.exhibits.map((exhibit) => exhibit.id);
    assert.equal(new Set(within).size, within.length, `${category.id} repeats an exhibit id`);
  }
  const categoryIds = CATEGORIES.map((category) => category.id);
  assert.equal(new Set(categoryIds).size, categoryIds.length);
});

test("every route the registry describes parses back to itself", () => {
  for (const { category, exhibit } of every)
    assert.deepEqual(parseRoute(`#/${category.id}/${exhibit.id}`), {
      category: category.id,
      exhibit: exhibit.id,
    });
});

test("a built exhibit carries everything the wall label needs", () => {
  for (const { exhibit } of built) {
    assert.equal(typeof exhibit.label, "string");
    assert.ok(exhibit.blurb?.length > 20, `${exhibit.id} needs a blurb`);
    assert.ok(Number.isInteger(exhibit.cruelty) && exhibit.cruelty >= 1 && exhibit.cruelty <= 5);
    assert.match(exhibit.added, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("a category counts as built when any of its exhibits is", () => {
  for (const category of CATEGORIES)
    assert.equal(
      isBuilt(category),
      category.exhibits.some((exhibit) => !exhibit.soon),
      category.id,
    );
});

test("lookup finds what the registry declares and nothing else", () => {
  for (const { category, exhibit } of every)
    assert.equal(lookup(category.id, exhibit.id)?.exhibit, exhibit);
  assert.equal(lookup("payment", "no-such-exhibit"), null);
  assert.equal(lookup("no-such-category", "odometer"), null);
});

test("the opening route lands on a built exhibit", () => {
  const found = lookup(openingRoute.category, openingRoute.exhibit);
  assert.ok(found, "the opening route resolves");
  assert.ok(!found.exhibit.soon, "the opening route is built");
});

test("asset paths are derived from the ids", () => {
  assert.equal(
    exhibitAsset("payment", "odometer", "exhibit.js"),
    "exhibits/payment/odometer/exhibit.js",
  );
});
