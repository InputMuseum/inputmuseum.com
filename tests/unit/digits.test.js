import { test } from "node:test";
import assert from "node:assert/strict";

import { BLANK } from "../../public/js/session.js";
import { fields } from "../../public/exhibits/payment/odometer/exhibit.js";
import {
  commitPlace,
  decayPending,
  emptyState,
  formPlaces,
  isSettled,
  placeNames,
  remaining,
  report,
  selectPlace,
  setPending,
  spellOut,
  wheelDigit,
} from "../../public/exhibits/payment/odometer/digits.js";

const LENGTH = fields.reduce((total, field) => total + field.length, 0);
const fresh = () => emptyState(LENGTH);
const enter = (state, place, digit) => commitPlace(setPending(selectPlace(state, place), digit));

test("place names run from the top down and cover every length the site can reach", () => {
  const names = placeNames(23);
  assert.equal(names.at(0), "Ten sextillions");
  assert.equal(names.at(-1), "Ones");
  assert.equal(names.at(-2), "Tens");
  assert.equal(names.at(-3), "Hundreds");
  assert.equal(names.at(-4), "Thousands");
  assert.equal(names.at(-5), "Ten thousands");
  assert.equal(names.at(-7), "Millions");
  for (const name of placeNames(24)) assert.match(name, /^[A-Z]/);
});

test("the form is named a field at a time, each with its own scale", () => {
  const places = formPlaces(fields);
  assert.equal(places.length, LENGTH);

  assert.equal(places.at(0).name, "Quadrillions", "the front of a sixteen-digit card number");
  assert.equal(places.at(15).name, "Ones");
  assert.equal(places.at(16).name, "Thousands", "the expiry starts its own scale over");
  assert.equal(places.at(19).name, "Ones");
  assert.equal(places.at(20).name, "Hundreds", "and so does the security code");
  assert.equal(places.at(-1).name, "Ones");
});

test("a place carries the field it belongs to, because three of them have a ones", () => {
  const places = formPlaces(fields);
  const ones = places.filter((place) => place.name === "Ones");
  assert.equal(ones.length, fields.length);
  assert.deepEqual(
    ones.map((place) => place.field.name),
    fields.map((field) => field.name),
  );
});

test("a fresh machine has nothing entered", () => {
  const state = fresh();
  assert.equal(remaining(state), LENGTH);
  assert.equal(report(state), BLANK.repeat(LENGTH));
  assert.equal(state.place, 0);
});

test("committing writes the pending digit into its place", () => {
  const state = enter(fresh(), 4, 7);
  assert.equal(report(state), `${BLANK.repeat(4)}7${BLANK.repeat(LENGTH - 5)}`);
  assert.equal(remaining(state), LENGTH - 1);
  assert.ok(isSettled(state, 4));
  assert.ok(!isSettled(state, 3));
});

test("committing sends the visitor back to the top place", () => {
  assert.equal(enter(fresh(), LENGTH - 1, 3).place, 0);
});

test("selecting a place seeds the pending digit from what is already there", () => {
  const entered = enter(fresh(), 9, 6);
  assert.equal(selectPlace(entered, 9).pending, 6);
  assert.equal(selectPlace(entered, 8).pending, 0);
});

test("leaving a place before committing throws the work away", () => {
  const abandoned = selectPlace(setPending(selectPlace(fresh(), 2), 8), 5);
  assert.equal(report(abandoned), BLANK.repeat(LENGTH));
  assert.equal(wheelDigit(abandoned, 2), 0);
});

test("the wheels show the pending digit where the visitor is, and what is settled elsewhere", () => {
  const state = setPending(selectPlace(enter(fresh(), 0, 4), 3), 9);
  assert.equal(wheelDigit(state, 3), 9, "the place being edited");
  assert.equal(wheelDigit(state, 0), 4, "a settled place");
  assert.equal(wheelDigit(state, 7), 0, "an untouched place");
});

test("decay walks the pending digit down to zero and stops there", () => {
  let state = setPending(fresh(), 2);
  state = decayPending(state);
  assert.equal(state.pending, 1);
  state = decayPending(decayPending(state));
  assert.equal(state.pending, 0);
});

test("decay leaves a settled digit alone", () => {
  const state = decayPending(enter(fresh(), 6, 5));
  assert.equal(report(state)[6], "5");
});

test("a full form reports as the digits of every field in turn", () => {
  const wanted = "4012888888881881" + "0928" + "123";
  let state = fresh();
  for (const [place, digit] of [...wanted].entries()) state = enter(state, place, Number(digit));

  assert.equal(report(state), wanted);
  assert.equal(remaining(state), 0);

  let from = 0;
  for (const field of fields) {
    assert.equal(report(state).slice(from, from + field.length).length, field.length, field.name);
    from += field.length;
  }
  assert.equal(from, LENGTH, "the fields account for every place");
});

test("the spoken form names the gaps", () => {
  assert.equal(spellOut(`4${BLANK}7`), "4 blank 7");
});
