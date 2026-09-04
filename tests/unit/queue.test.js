import { test } from "node:test";
import assert from "node:assert/strict";

import { BLANK } from "../../public/js/session.js";
import { LENGTH } from "../../public/exhibits/payment/form.js";
import {
  MAX_DIGIT,
  MAX_VERIFY_MS,
  MIN_VERIFY_MS,
  accept,
  cursor,
  emptyState,
  entryAt,
  isOpen,
  isVerifying,
  remaining,
  report,
  shuffled,
  submit,
  verifyMs,
} from "../../public/exhibits/payment/bureaucrat/queue.js";

// Randomness arrives as an argument, so a shuffle and a wait can both be told
// exactly what to be.
const fixed = (value) => () => value;

const fresh = () => emptyState(LENGTH);

const enter = (state, at, digit) => accept(submit(state, at, digit));

const fill = (digits) =>
  [...digits].reduce((state, digit, at) => enter(state, at, Number(digit)), fresh());

test("a fresh queue reports nothing and opens only the first entry", () => {
  const state = fresh();
  assert.equal(report(state), BLANK.repeat(LENGTH));
  assert.equal(remaining(state), LENGTH);
  assert.ok(isOpen(state, 0));
  assert.ok(!isOpen(state, 1));
});

test("an entry is not reported until it has been verified", () => {
  const state = submit(fresh(), 0, 7);
  assert.ok(isVerifying(state));
  assert.equal(entryAt(state, 0), 7, "the visitor sees what they chose");
  assert.equal(report(state)[0], BLANK, "and the form has not been given it");
  assert.equal(report(accept(state))[0], "7");
});

test("a verified entry opens the next one and no further", () => {
  const state = enter(fresh(), 0, 7);
  assert.ok(!isVerifying(state));
  assert.equal(cursor(state), 1);
  assert.ok(isOpen(state, 1));
  assert.ok(!isOpen(state, 2));
});

test("an entry stays open after it is verified, so it can be amended", () => {
  assert.ok(isOpen(enter(enter(fresh(), 0, 7), 1, 4), 0));
});

test("an amendment clears every entry made after it", () => {
  const five = fill("40128");
  assert.equal(cursor(five), 5);

  const amending = submit(five, 1, 9);
  assert.equal(report(amending).slice(0, 5), `4${BLANK.repeat(4)}`);
  assert.equal(cursor(amending), 1, "the amended entry is not itself verified yet");
  assert.ok(!isOpen(amending, 2));

  const amended = accept(amending);
  assert.equal(report(amended).slice(0, 5), `49${BLANK.repeat(3)}`);
  assert.equal(remaining(amended), LENGTH - 2, "the three after it have to be entered again");
});

test("a whole form is reported once every entry has been verified", () => {
  const wanted = `${"4012888888881881"}${"0928"}${"123"}`;
  const state = fill(wanted);
  assert.equal(remaining(state), 0);
  assert.equal(report(state), wanted);
  assert.equal(cursor(state), LENGTH);
});

test("submitting leaves the state it was given alone", () => {
  const before = fill("401");
  submit(before, 1, 9);
  assert.equal(report(before).slice(0, 4), `401${BLANK}`);
  assert.ok(!isVerifying(before));
});

test("a shuffle offers every digit exactly once", () => {
  const digits = Array.from({ length: MAX_DIGIT + 1 }, (_, digit) => digit);
  assert.deepEqual(
    [...shuffled(Math.random)].sort((a, b) => a - b),
    digits,
  );
  assert.deepEqual(shuffled(fixed(0)), shuffled(fixed(0)), "one source, one order");
});

test("a wait lands inside the bounds it is offered", () => {
  assert.equal(verifyMs(fixed(0)), MIN_VERIFY_MS);
  assert.equal(verifyMs(fixed(0.999999)), MAX_VERIFY_MS);
});
