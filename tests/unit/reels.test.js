import { test } from "node:test";
import assert from "node:assert/strict";

import { BLANK } from "../../public/js/session.js";
import { LENGTH } from "../../public/exhibits/payment/form.js";
import {
  MAX_DIGIT,
  emptyState,
  heldCount,
  isHeld,
  report,
  spin,
  spinnable,
  toggleHold,
} from "../../public/exhibits/payment/slot-machine/reels.js";

// Randomness arrives as an argument, so a spin can be told exactly what to land.
const lands = (...digits) => {
  let at = 0;
  return () => digits[at++ % digits.length] / (MAX_DIGIT + 1);
};

const fresh = () => emptyState(LENGTH);

test("a fresh machine holds nothing and reports nothing", () => {
  const state = fresh();
  assert.equal(heldCount(state), 0);
  assert.equal(report(state), BLANK.repeat(LENGTH));
  assert.ok(spinnable(state));
});

test("a spin lands the digits it is given", () => {
  const state = spin(fresh(), lands(4, 0, 1, 2));
  assert.deepEqual(state.digits.slice(0, 4), [4, 0, 1, 2]);
});

test("a spin can land any digit including the ends of the reel", () => {
  const state = spin(fresh(), lands(0, MAX_DIGIT));
  assert.deepEqual(state.digits.slice(0, 2), [0, MAX_DIGIT]);
});

test("only a held digit is reported", () => {
  let state = spin(fresh(), lands(7));
  assert.equal(report(state), BLANK.repeat(LENGTH));

  state = toggleHold(state, 3);
  assert.equal(report(state)[3], "7");
  assert.equal(report(state)[2], BLANK);
  assert.equal(heldCount(state), 1);
});

test("a held reel sits out the next spin while the rest move", () => {
  const held = toggleHold(spin(fresh(), lands(5)), 0);
  const after = spin(held, lands(2));

  assert.equal(after.digits[0], 5, "the held reel");
  assert.equal(after.digits[1], 2, "an open reel");
  assert.equal(report(after)[0], "5");
});

test("releasing a reel puts it back in play", () => {
  const held = toggleHold(spin(fresh(), lands(5)), 0);
  const released = toggleHold(held, 0);
  assert.ok(!isHeld(released, 0));
  assert.equal(report(released)[0], BLANK);
  assert.equal(spin(released, lands(3)).digits[0], 3);
});

test("the machine stops being spinnable once every reel is held", () => {
  let state = spin(fresh(), lands(1));
  for (let at = 0; at < LENGTH; at++) state = toggleHold(state, at);

  assert.equal(heldCount(state), LENGTH);
  assert.ok(!spinnable(state));
  assert.equal(report(state), "1".repeat(LENGTH));
});

test("spinning leaves the state it was given alone", () => {
  const before = fresh();
  spin(before, lands(9));
  assert.deepEqual(before.digits, Array(LENGTH).fill(0));
});

test("a whole form can be held to a chosen number", () => {
  const wanted = `${"4012888888881881"}${"0928"}${"123"}`;
  let state = spin(fresh(), lands(...[...wanted].map(Number)));
  for (let at = 0; at < LENGTH; at++) state = toggleHold(state, at);
  assert.equal(report(state), wanted);
});
