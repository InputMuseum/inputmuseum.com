import { test } from "node:test";
import assert from "node:assert/strict";

import { fields } from "../../public/exhibits/identity/form.js";
import { emptyState, generate, matches } from "../../public/exhibits/identity/generator/guesses.js";

const NAMES = fields.map((field) => field.name);
const seeded = (seed) => () => (seed = (seed * 48271) % 2147483647) / 2147483647;

const run = (random, rounds = 200) => {
  const seen = [];
  let state = emptyState(NAMES);
  for (let round = 0; round < rounds; round++)
    for (const name of NAMES) {
      state = generate(state, name, random);
      seen.push([name, state[name].value]);
    }
  return seen;
};

test("a field says nothing until it has been generated", () => {
  const state = emptyState(NAMES);
  for (const name of NAMES) assert.deepEqual(state[name], { value: "", was: "", attempts: 0 });
});

test("the generator has something to produce for every field the form declares", () => {
  const random = seeded(7);
  let state = emptyState(NAMES);
  for (const name of NAMES) {
    state = generate(state, name, random);
    assert.ok(state[name].value.length > 0, `${name} generated nothing`);
  }
});

test("generating keeps what it replaced and counts the attempt", () => {
  const random = seeded(11);
  let state = generate(emptyState(NAMES), "name", random);
  const first = state.name.value;

  state = generate(state, "name", random);
  assert.equal(state.name.was, first);
  assert.equal(state.name.attempts, 2);
  assert.equal(state.email.attempts, 0, "the other fields are untouched");
});

test("a replayed run produces the same identities", () => {
  assert.deepEqual(run(seeded(3)), run(seeded(3)));
  assert.notDeepEqual(run(seeded(3)), run(seeded(4)));
});

// The site's promise is that nothing reaches anyone, which a generator can
// break on its own by inventing a live mailbox or a number that rings.
test("every mail address lands on a domain reserved for documentation", () => {
  for (const [name, value] of run(seeded(5)))
    if (name === "email") assert.match(value, /^[a-z0-9.]+@example\.(com|net|org)$/, value);
});

test("every phone number sits in a range reserved for drama", () => {
  for (const [name, value] of run(seeded(5)))
    if (name === "phone")
      assert.match(value, /^(07700 900|020 7946 0|01(13|21|31|61) 496 0)\d{3}$/, value);
});

test("matching lines two results up position by position", () => {
  assert.deepEqual(matches("abcd", "abxd"), [true, true, false, true]);
  assert.deepEqual(matches("abc", "ab"), [true, true, false], "past the end of the shorter one");
  assert.deepEqual(matches("abc", ""), [false, false, false], "with nothing to match against");
  assert.deepEqual(matches("", "abc"), []);
});
