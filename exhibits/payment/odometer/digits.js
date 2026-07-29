// The odometer's state, as values. No DOM, so the machine can be reasoned
// about in a test rather than by dragging sliders sixteen times.
//
// A place is settled once it has been committed; until then the visitor is
// only ever editing `pending`, and leaving the place throws that work away.

import { BLANK } from "../../../js/session.js";

export const DIGITS = 16;
export const MAX_DIGIT = 9;

export const PLACES = [
  "Quadrillions",
  "Hundred trillions",
  "Ten trillions",
  "Trillions",
  "Hundred billions",
  "Ten billions",
  "Billions",
  "Hundred millions",
  "Ten millions",
  "Millions",
  "Hundred thousands",
  "Ten thousands",
  "Thousands",
  "Hundreds",
  "Tens",
  "Ones",
];

export const emptyState = () => ({
  committed: Array(DIGITS).fill(null),
  place: 0,
  pending: 0,
});

export const selectPlace = (state, place) => ({
  ...state,
  place,
  pending: state.committed[place] ?? 0,
});

export const setPending = (state, pending) => ({ ...state, pending });

// Returning to the top place is the point of the exhibit, not an oversight:
// every digit costs the full journey back down.
export const commitPlace = (state) => {
  const committed = state.committed.slice();
  committed[state.place] = state.pending;
  return selectPlace({ ...state, committed }, 0);
};

export const decayPending = (state) => ({ ...state, pending: Math.max(0, state.pending - 1) });

export const isSettled = (state, place) => state.committed[place] !== null;

export const wheelDigit = (state, place) =>
  place === state.place ? state.pending : (state.committed[place] ?? 0);

export const remaining = (state) => state.committed.filter((digit) => digit === null).length;

export const report = (state) =>
  state.committed.map((digit) => (digit === null ? BLANK : String(digit))).join("");

export const spellOut = (state) =>
  state.committed.map((digit) => (digit === null ? "blank" : String(digit))).join(" ");
