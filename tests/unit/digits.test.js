import { test } from "node:test";
import assert from "node:assert/strict";

import { BLANK } from "../../js/session.js";
import {
  DIGITS,
  PLACES,
  commitPlace,
  decayPending,
  emptyState,
  isSettled,
  remaining,
  report,
  selectPlace,
  setPending,
  spellOut,
  wheelDigit,
} from "../../exhibits/payment/odometer/digits.js";

const enter = (state, place, digit) => commitPlace(setPending(selectPlace(state, place), digit));

test("there is a place name for every digit", () => {
  assert.equal(PLACES.length, DIGITS);
});

test("a fresh machine has nothing entered", () => {
  const state = emptyState();
  assert.equal(remaining(state), DIGITS);
  assert.equal(report(state), BLANK.repeat(DIGITS));
  assert.equal(state.place, 0);
});

test("committing writes the pending digit into its place", () => {
  const state = enter(emptyState(), 4, 7);
  assert.equal(report(state), `${BLANK.repeat(4)}7${BLANK.repeat(11)}`);
  assert.equal(remaining(state), DIGITS - 1);
  assert.ok(isSettled(state, 4));
  assert.ok(!isSettled(state, 3));
});

test("committing sends the visitor back to the top place", () => {
  assert.equal(enter(emptyState(), 15, 3).place, 0);
});

test("selecting a place seeds the pending digit from what is already there", () => {
  const entered = enter(emptyState(), 9, 6);
  assert.equal(selectPlace(entered, 9).pending, 6);
  assert.equal(selectPlace(entered, 8).pending, 0);
});

test("leaving a place before committing throws the work away", () => {
  const abandoned = selectPlace(setPending(selectPlace(emptyState(), 2, 0), 8), 5);
  assert.equal(report(abandoned), BLANK.repeat(DIGITS));
  assert.equal(wheelDigit(abandoned, 2), 0);
});

test("the wheels show the pending digit where the visitor is, and what is settled elsewhere", () => {
  const state = setPending(selectPlace(enter(emptyState(), 0, 4), 3), 9);
  assert.equal(wheelDigit(state, 3), 9, "the place being edited");
  assert.equal(wheelDigit(state, 0), 4, "a settled place");
  assert.equal(wheelDigit(state, 7), 0, "an untouched place");
});

test("decay walks the pending digit down to zero and stops there", () => {
  let state = setPending(emptyState(), 2);
  state = decayPending(state);
  assert.equal(state.pending, 1);
  state = decayPending(decayPending(state));
  assert.equal(state.pending, 0);
});

test("decay leaves a settled digit alone", () => {
  const state = decayPending(enter(emptyState(), 6, 5));
  assert.equal(report(state)[6], "5");
});

test("a full number reports as its digits", () => {
  let state = emptyState();
  for (const [place, digit] of [..."4012888888881881"].entries())
    state = enter(state, place, Number(digit));

  assert.equal(report(state), "4012888888881881");
  assert.equal(remaining(state), 0);
});

test("the spoken form names the gaps", () => {
  assert.equal(
    spellOut(enter(emptyState(), 0, 4))
      .split(" ")
      .slice(0, 2)
      .join(" "),
    "4 blank",
  );
});
