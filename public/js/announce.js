import { $ } from "./dom.js";

// Clearing the region before the write is what lets the same sentence announce
// twice in a row; a control that repeats itself is exactly what this site is
// full of.
const CLEAR_MS = 120;

let node = null;
let pending = 0;

export function announce(text) {
  silence();
  pending = setTimeout(() => (node.textContent = text), CLEAR_MS);
}

export function silence() {
  node ??= $("announcer");
  clearTimeout(pending);
  node.textContent = "";
}
