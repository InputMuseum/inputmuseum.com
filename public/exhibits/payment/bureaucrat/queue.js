// The queue, as values. No DOM, and randomness arrives as an argument, so a
// shuffle and a wait can both be replayed exactly.
//
// Entries are accepted in order: `entered` is the prefix that has cleared
// verification, and `pending` is the entry still in it, which counts for
// nothing until it does.

import { BLANK } from "../../../js/session.js";

export const MAX_DIGIT = 9;

// Cruelty: no two waits are the same length, so nothing about the last entry
// says when this one is done.
export const MIN_VERIFY_MS = 1000;
export const MAX_VERIFY_MS = 3000;

export const emptyState = (length) => ({ entered: Array(length).fill(null), pending: null });

export const cursor = (state) => {
  const open = state.entered.indexOf(null);
  return open === -1 ? state.entered.length : open;
};

export const isOpen = (state, at) => at <= cursor(state);

// An amendment clears every entry made after it: the form those entries were
// made against no longer exists.
export const submit = (state, at, digit) => ({
  entered: state.entered.map((was, index) => (index < at ? was : null)),
  pending: { at, digit },
});

export const accept = (state) => ({
  entered: state.entered.map((was, index) =>
    index === state.pending.at ? state.pending.digit : was,
  ),
  pending: null,
});

export const isVerifying = (state) => state.pending !== null;

export const entryAt = (state, at) =>
  state.pending?.at === at ? state.pending.digit : state.entered[at];

export const remaining = (state) => state.entered.filter((digit) => digit === null).length;

export const report = (state) =>
  state.entered.map((digit) => (digit === null ? BLANK : String(digit))).join("");

export const shuffled = (random) => {
  const digits = Array.from({ length: MAX_DIGIT + 1 }, (_, digit) => digit);
  for (let at = digits.length - 1; at > 0; at--) {
    const swap = Math.floor(random() * (at + 1));
    [digits[at], digits[swap]] = [digits[swap], digits[at]];
  }
  return digits;
};

export const verifyMs = (random) =>
  MIN_VERIFY_MS + Math.floor(random() * (MAX_VERIFY_MS - MIN_VERIFY_MS + 1));
