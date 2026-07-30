// The machine's state, as values. No DOM, and randomness arrives as an
// argument, so a spin can be replayed exactly in a test.
//
// A held reel is a committed digit; everything else is whatever the last spin
// left there and counts for nothing.

import { BLANK } from "../../../js/session.js";

export const MAX_DIGIT = 9;

export const emptyState = (length) => ({
  digits: Array(length).fill(0),
  held: Array(length).fill(false),
});

export const spin = (state, random) => ({
  ...state,
  digits: state.digits.map((digit, at) =>
    state.held[at] ? digit : Math.floor(random() * (MAX_DIGIT + 1)),
  ),
});

export const toggleHold = (state, at) => ({
  ...state,
  held: state.held.map((was, index) => (index === at ? !was : was)),
});

export const isHeld = (state, at) => state.held[at];

export const heldCount = (state) => state.held.filter(Boolean).length;

export const spinnable = (state) => state.held.some((held) => !held);

export const report = (state) =>
  state.digits.map((digit, at) => (state.held[at] ? String(digit) : BLANK)).join("");
