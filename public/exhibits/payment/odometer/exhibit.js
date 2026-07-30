import { el } from "../../../js/el.js";
import { duration } from "../../../js/motion.js";
import {
  MAX_DIGIT,
  commitPlace,
  decayPending,
  emptyState,
  isSettled,
  placeNames,
  remaining,
  report,
  selectPlace,
  setPending,
  spellOut,
  wheelDigit,
} from "./digits.js";
import { LENGTH, fields, slices } from "../form.js";

export { fields };

const PLACES = placeNames(LENGTH);

const ROLL_MS_PER_STEP = 55;
// Cruelty: an unsettled digit starts sliding back to zero if it is left alone,
// so hesitating costs the digit rather than nothing.
const IDLE_MS = 3000;
const DECAY_MS = 2000;

export function mount(root, api) {
  let state = emptyState(LENGTH);
  let idleTimer = 0;
  let decayTimer = 0;

  const cells = Array.from({ length: LENGTH }, () =>
    el(
      "span",
      { class: "odo-cell" },
      el(
        "span",
        { class: "odo-strip" },
        ...Array.from({ length: MAX_DIGIT + 1 }, (_, digit) =>
          el("span", { class: "odo-num", text: String(digit) }),
        ),
      ),
    ),
  );

  const [first, ...rest] = sliceFields(cells);
  const readout = el(
    "div",
    { class: "odo-readout", role: "img" },
    first,
    el("div", { class: "odo-pair" }, ...rest),
  );

  const placeInput = el("input", {
    type: "range",
    class: "odo-range",
    id: "odo-place",
    min: 0,
    max: LENGTH - 1,
    step: 1,
    value: 0,
  });
  const placeName = el("output", { class: "odo-place-name", for: "odo-place" });

  const digitInput = el("input", {
    type: "range",
    class: "odo-range",
    id: "odo-digit",
    min: 0,
    max: MAX_DIGIT,
    step: 1,
    value: MAX_DIGIT,
  });

  const setBtn = el("button", { class: "btn btn-primary odo-set", type: "button" });
  const tally = el("p", { class: "odo-tally" });

  root.append(
    el(
      "div",
      { class: "plinth odo" },
      readout,
      el(
        "div",
        { class: "odo-controls" },
        control("Place value", placeInput, placeName, [PLACES.at(0), PLACES.at(-1)]),
        control("Digit", digitInput, null, [String(MAX_DIGIT), "0"]),
      ),
      el("div", { class: "odo-actions" }, setBtn, tally),
      el("p", {
        class: "odo-hint",
        text: "The place-value selector returns to the top after every digit, so you never lose your place.",
      }),
    ),
  );

  placeInput.addEventListener(
    "input",
    () => {
      state = selectPlace(state, Number(placeInput.value));
      touch();
      render();
    },
    { signal: api.signal },
  );

  placeInput.addEventListener(
    "change",
    () => api.announce(`${PLACES[state.place]}. ${settledPhrase()}`),
    { signal: api.signal },
  );

  digitInput.addEventListener(
    "input",
    () => {
      state = setPending(state, MAX_DIGIT - Number(digitInput.value));
      touch();
      render();
    },
    { signal: api.signal },
  );

  setBtn.addEventListener("click", commit, { signal: api.signal });

  api.signal.addEventListener("abort", stopDecay);

  render();

  function commit() {
    const place = PLACES[state.place];
    const digit = state.pending;
    state = commitPlace(state);
    publish();
    touch();
    render();
    api.announce(`${place} set to ${digit}. ${remaining(state)} of ${LENGTH} still to enter.`);
  }

  function publish() {
    for (const [field, digits] of slices(report(state))) api.set(field.name, digits);
  }

  function touch() {
    stopDecay();
    if (isSettled(state, state.place) || state.pending === 0) return;
    idleTimer = setTimeout(startDecay, IDLE_MS);
  }

  function startDecay() {
    api.announce("Holding. The digit is returning to zero.");
    decayTimer = setInterval(() => {
      state = decayPending(state);
      render();
      if (state.pending === 0) stopDecay();
    }, DECAY_MS);
  }

  function stopDecay() {
    clearTimeout(idleTimer);
    clearInterval(decayTimer);
  }

  function render() {
    cells.forEach((cell, place) => {
      const digit = wheelDigit(state, place);
      const strip = cell.firstElementChild;
      const distance = Math.abs(digit - Number(strip.dataset.digit ?? 0));
      strip.style.transitionDuration = `${duration(ROLL_MS_PER_STEP * distance)}ms`;
      strip.style.setProperty("--digit", digit);
      strip.dataset.digit = digit;
      cell.classList.toggle("is-active", place === state.place);
      cell.classList.toggle("is-settled", isSettled(state, place));
    });

    readout.setAttribute("aria-label", describe());

    placeInput.value = String(state.place);
    placeInput.setAttribute(
      "aria-valuetext",
      `${PLACES[state.place]}, digit ${state.place + 1} of ${LENGTH}, ${settledPhrase()}`,
    );
    placeName.textContent = PLACES[state.place];

    digitInput.value = String(MAX_DIGIT - state.pending);
    digitInput.setAttribute("aria-valuetext", String(state.pending));

    setBtn.textContent = `Set ${PLACES[state.place].toLowerCase()} to ${state.pending}`;
    tally.textContent = `${remaining(state)} of ${LENGTH} still to enter`;
  }

  function describe() {
    return [...slices(report(state))]
      .map(([field, digits]) => `${field.label}: ${spellOut(digits)}`)
      .join(". ");
  }

  function settledPhrase() {
    return isSettled(state, state.place) ? "already entered" : "not yet entered";
  }
}

function sliceFields(cells) {
  return [...slices(cells)].map(([field, mine]) =>
    el(
      "div",
      { class: "odo-field" },
      el("span", { class: "odo-field-label", text: field.label }),
      el("span", { class: "odo-wheels" }, ...grouped(mine, field.group)),
    ),
  );
}

function grouped(cells, size) {
  const out = [];
  for (let at = 0; at < cells.length; at += size)
    out.push(el("span", { class: "odo-group" }, ...cells.slice(at, at + size)));
  return out;
}

function control(label, input, output, [left, right]) {
  return el(
    "div",
    { class: "odo-control" },
    el("label", { class: "odo-label", for: input.id, text: label }),
    el(
      "div",
      { class: "odo-track" },
      el("span", { class: "odo-end", text: left }),
      input,
      el("span", { class: "odo-end", text: right }),
    ),
    output,
  );
}
