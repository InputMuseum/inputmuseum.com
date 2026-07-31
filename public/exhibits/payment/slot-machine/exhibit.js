import { el } from "../../../js/el.js";
import { duration } from "../../../js/motion.js";
import { LENGTH, fields, slices } from "../form.js";
import {
  MAX_DIGIT,
  emptyState,
  heldCount,
  isHeld,
  report,
  spin,
  spinnable,
  toggleHold,
} from "./reels.js";

export { fields };

const CELL_EM = 1.6;
const LAP = MAX_DIGIT + 1;
const SPIN_MS = 450;
// Reels settle left to right, and a visit is a great many spins, so the whole
// sequence has to land well inside a second.
const STAGGER_MS = 18;
const EASING = "cubic-bezier(0.1, 0.4, 0.15, 1)";

const PLACES = [...slices(Array.from({ length: LENGTH }, (_, at) => at))].flatMap(([field, mine]) =>
  mine.map((_, place) => ({ field, place: place + 1 })),
);

export function mount(root, api) {
  let state = spin(emptyState(LENGTH), Math.random);
  let spins = 0;
  let settling = false;
  let settleTimer = 0;

  const reels = Array.from({ length: LENGTH }, () => {
    const hold = el("input", { type: "checkbox", class: "slot-hold" });
    const strip = el(
      "span",
      { class: "slot-strip" },
      ...Array.from({ length: LAP * 3 }, (_, cell) =>
        el("span", { class: "slot-num", text: String(cell % LAP) }),
      ),
    );
    const face = el("span", { class: "slot-window", "aria-hidden": true }, strip);
    return { hold, strip, node: el("label", { class: "slot-reel" }, hold, face) };
  });

  const spinBtn = el("button", {
    class: "btn btn-primary slot-spin",
    type: "button",
    text: "Spin",
  });
  const tally = el("p", { class: "tally" });
  const [first, ...rest] = banks();

  root.append(
    el(
      "div",
      { class: "plinth slot" },
      el("div", { class: "slot-board" }, first, el("div", { class: "slot-pair" }, ...rest)),
      el("div", { class: "actions slot-actions" }, spinBtn, tally),
      el("p", {
        class: "hint",
        text: "Tip: hold any reel that has landed correctly, wherever it is. There is no need to work left to right.",
      }),
    ),
  );

  spinBtn.addEventListener("click", pull, { signal: api.signal });
  api.signal.addEventListener("abort", () => clearTimeout(settleTimer));

  reels.forEach(({ hold }, at) =>
    hold.addEventListener(
      "change",
      () => {
        // A reel still settling has not shown its digit yet, so it cannot be
        // held at one: the model already knows what is coming and would hand
        // over a digit nobody saw.
        if (settling) {
          hold.checked = isHeld(state, at);
          return;
        }
        state = toggleHold(state, at);
        publish();
        paint(at);
        paintChrome();
        announceHold(at);
      },
      { signal: api.signal },
    ),
  );

  reels.forEach((_, at) => paint(at));
  paintChrome();
  publish();

  function pull() {
    if (!spinnable(state) || settling) return;
    const before = state;
    state = spin(state, Math.random);
    spins += 1;
    settling = true;

    const rolls = [];
    reels.forEach(({ strip }, at) => {
      if (isHeld(state, at)) return;
      rolls.push(roll(strip, before.digits[at], state.digits[at], duration(at * STAGGER_MS)));
      // the labels are the board for anyone not watching it, so they tell the
      // truth as soon as the truth is known
      label(at);
    });
    paintChrome();
    api.announce(`Spun. ${heldCount(state)} of ${LENGTH} held.`);

    // A timer rather than the animations' own completion: a hidden tab never
    // ticks them, and the machine would come back from a switched-away spin
    // with nothing to press.
    settleTimer = setTimeout(settle, duration((LENGTH - 1) * STAGGER_MS + SPIN_MS), rolls);
  }

  function settle(rolls) {
    settling = false;
    // the filled end row shows the landing digit a lap further down, so taking
    // the transform back from the animation is invisible
    reels.forEach((_, at) => paint(at));
    rolls.forEach((animation) => animation.cancel());
    paintChrome();
  }

  function roll(strip, from, to, delay) {
    const distance = LAP + ((to - from + LAP) % LAP);
    return strip.animate(
      [{ transform: rowOffset(from) }, { transform: rowOffset(from + distance) }],
      { duration: duration(SPIN_MS), delay, easing: EASING, fill: "both" },
    );
  }

  function paint(at) {
    const { strip, node } = reels[at];
    strip.style.transform = rowOffset(state.digits[at]);
    node.classList.toggle("is-held", isHeld(state, at));
    label(at);
  }

  function label(at) {
    const { hold } = reels[at];
    const { field, place } = PLACES[at];
    hold.checked = isHeld(state, at);
    hold.setAttribute(
      "aria-label",
      `Hold ${field.label.toLowerCase()} position ${place} of ${field.length}, showing ${state.digits[at]}`,
    );
  }

  function paintChrome() {
    spinBtn.disabled = !spinnable(state) || settling;
    tally.textContent =
      `${heldCount(state)} of ${LENGTH} held` +
      (spins ? ` · ${spins} spin${spins === 1 ? "" : "s"}` : "");
  }

  function publish() {
    for (const [field, digits] of slices(report(state))) api.set(field.name, digits);
  }

  function announceHold(at) {
    const { field, place } = PLACES[at];
    api.announce(
      isHeld(state, at)
        ? `${field.label} position ${place} held at ${state.digits[at]}. ${heldCount(state)} of ${LENGTH} held.`
        : `${field.label} position ${place} released.`,
    );
  }

  function banks() {
    return [...slices(reels)].map(([field, mine]) =>
      el(
        "fieldset",
        { class: "slot-field" },
        el("legend", { class: "eyebrow slot-legend", text: field.label }),
        el(
          "div",
          { class: "slot-reels" },
          ...grouped(
            mine.map(({ node }) => node),
            field.group,
          ),
        ),
      ),
    );
  }
}

const rowOffset = (row) => `translateY(-${row * CELL_EM}em)`;

function grouped(nodes, size) {
  const out = [];
  for (let at = 0; at < nodes.length; at += size)
    out.push(el("span", { class: "slot-group" }, ...nodes.slice(at, at + size)));
  return out;
}
