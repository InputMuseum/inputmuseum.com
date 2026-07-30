import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BLANK,
  beginSession,
  isComplete,
  restartSession,
  setValue,
  snapshot,
  subscribe,
} from "../../public/js/session.js";

const CARD = [{ name: "number", label: "Card number", length: 16, group: 4 }];

test("beginning a session blanks every field to its declared width", () => {
  beginSession(CARD);
  assert.equal(snapshot().values.get("number"), BLANK.repeat(16));
  assert.equal(snapshot().complete, false);
});

test("a field is complete only once no position is left blank", () => {
  const field = CARD[0];
  assert.equal(isComplete(field, `4012${BLANK.repeat(12)}`), false);
  assert.equal(isComplete(field, "4012888888881881"), true);
  assert.equal(isComplete(field, "401288888888188"), false, "short of its declared length");
  assert.equal(isComplete(field, undefined), false);
});

test("a field with no declared length is complete once it says anything", () => {
  const field = { name: "name", label: "Name" };
  assert.equal(isComplete(field, ""), false);
  assert.equal(isComplete(field, "Abe"), true);
});

test("the session completes when its fields do", () => {
  beginSession(CARD);
  setValue("number", `4012${BLANK.repeat(12)}`);
  assert.equal(snapshot().complete, false);
  setValue("number", "4012888888881881");
  assert.equal(snapshot().complete, true);
});

test("elapsed time runs from the moment the session began", () => {
  beginSession(CARD, 1000);
  assert.equal(snapshot(4500).elapsedMs, 3500);
});

test("starting over blanks the values, counts the attempt and restarts the clock", () => {
  beginSession(CARD, 1000);
  setValue("number", "4012888888881881");
  restartSession(9000);

  const after = snapshot(9000);
  assert.equal(after.values.get("number"), BLANK.repeat(16));
  assert.equal(after.attempts, 2);
  assert.equal(after.elapsedMs, 0);
  assert.equal(after.complete, false);
});

test("an exhibit with no fields reports no elapsed time and never completes", () => {
  beginSession([], 1000);
  assert.equal(snapshot(9000).elapsedMs, 0);
  assert.equal(snapshot(9000).complete, false);
});

test("subscribers hear every change until they unsubscribe", () => {
  let heard = 0;
  const stop = subscribe(() => heard++);

  beginSession(CARD);
  setValue("number", "4012888888881881");
  restartSession();
  assert.equal(heard, 3);

  stop();
  setValue("number", "4012888888881881");
  assert.equal(heard, 3);
});

test("a snapshot is a copy, so a caller can't write into the session", () => {
  beginSession(CARD);
  snapshot().values.set("number", "4012888888881881");
  assert.equal(snapshot().complete, false);
});
