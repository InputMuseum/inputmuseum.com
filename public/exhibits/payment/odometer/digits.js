// The odometer's state, as values. No DOM, so the machine can be reasoned
// about in a test rather than by dragging sliders twenty-three times.
//
// A place is settled once it has been committed; until then the visitor is
// only ever editing `pending`, and leaving the place throws that work away.

import { BLANK } from "../../../js/session.js";

export const MAX_DIGIT = 9;

const UNITS = ["Ones", "Tens", "Hundreds"];
const STEPS = ["", "Ten ", "Hundred "];
const SCALES = [
  "thousand",
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
  "sextillion",
];

// Names run from the most significant place down, so index 0 is the leftmost
// digit however long the number is.
export const placeNames = (length) => Array.from({ length }, (_, at) => placeName(length - 1 - at));

function placeName(exponent) {
  if (exponent < 3) return UNITS[exponent];
  const scale = `${SCALES[Math.floor(exponent / 3) - 1]}s`;
  const step = exponent % 3;
  return step ? `${STEPS[step]}${scale}` : `${scale[0].toUpperCase()}${scale.slice(1)}`;
}

export const emptyState = (length) => ({
  committed: Array(length).fill(null),
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

export const spellOut = (digits) =>
  [...digits].map((digit) => (digit === BLANK ? "blank" : digit)).join(" ");
