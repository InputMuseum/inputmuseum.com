import { el } from "../../../js/el.js";
import { BLANK } from "../../../js/session.js";
import { LENGTH, fields, slices } from "../form.js";
import {
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
} from "./queue.js";

export { fields };

const PLACES = [...slices(Array.from({ length: LENGTH }, (_, at) => at))].flatMap(([field, mine]) =>
  mine.map((_, place) => ({ field, place: place + 1 })),
);

const named = (at) =>
  `${PLACES[at].field.label} entry ${PLACES[at].place} of ${PLACES[at].field.length}`;

export function mount(root, api) {
  let state = emptyState(LENGTH);
  let timer = 0;

  const picks = Array.from({ length: LENGTH }, (_, at) => {
    const pick = el("select", { class: "bur-pick", "aria-label": named(at) });
    pick.addEventListener("focus", () => fill(at), { signal: api.signal });
    pick.addEventListener("change", () => enter(at, Number(pick.value)), { signal: api.signal });
    return pick;
  });

  const spinner = el("span", { class: "bur-spinner", "aria-hidden": true });
  const tally = el("p", { class: "tally" });
  const [first, ...rest] = banks();

  root.append(
    el(
      "div",
      { class: "plinth bur" },
      el("div", { class: "bur-board" }, first, el("div", { class: "bur-pair" }, ...rest)),
      el("div", { class: "actions" }, tally, spinner),
      el("p", {
        class: "hint",
        text: "Entries are accepted in the order they are made. An entry may be amended at any time; for your security, every entry made after an amended one is cleared and verified again.",
      }),
    ),
  );

  api.signal.addEventListener("abort", () => clearTimeout(timer));

  picks.forEach((_, at) => fill(at));
  render();

  function enter(at, digit) {
    clearTimeout(timer);
    const cleared = Math.max(0, cursor(state) - at - 1);
    state = submit(state, at, digit);
    publish();
    render();
    api.announce(
      `${named(at)} submitted as ${digit}. Verifying.` +
        (cleared ? ` ${cleared} later ${cleared === 1 ? "entry" : "entries"} cleared.` : ""),
    );
    // The wait is the exhibit rather than an animation, so it is the same
    // length whatever the visitor's motion setting says.
    timer = setTimeout(verified, verifyMs(Math.random));
  }

  function verified() {
    const { at, digit } = state.pending;
    state = accept(state);
    publish();
    render();
    // the visitor is waiting on the entry that just cleared, so the one it
    // released is where they are; anywhere else and they have moved on
    if (root.contains(document.activeElement)) picks[at + 1]?.focus();
    api.announce(
      `${named(at)} accepted as ${digit}. ` +
        (remaining(state)
          ? `${remaining(state)} of ${LENGTH} still to enter.`
          : "The form is complete."),
    );
  }

  // Cruelty: the list is ordered afresh every time the visitor arrives at a
  // control, so nothing learned at one entry survives to the next. Focus is
  // where it happens because a click and a Tab both pass through it before
  // the list can be read.
  function fill(at) {
    const digit = entryAt(state, at);
    picks[at].replaceChildren(
      el("option", { value: "", disabled: true, text: BLANK }),
      ...shuffled(Math.random).map((option) =>
        el("option", { value: String(option), text: String(option) }),
      ),
    );
    picks[at].value = digit === null ? "" : String(digit);
  }

  function render() {
    picks.forEach((pick, at) => {
      const digit = entryAt(state, at);
      pick.value = digit === null ? "" : String(digit);
      pick.disabled = !isOpen(state, at);
      pick.classList.toggle("is-entered", state.entered[at] !== null);
      pick.classList.toggle("is-due", at === cursor(state) && !isVerifying(state));
      pick.classList.toggle("is-verifying", state.pending?.at === at);
    });
    spinner.classList.toggle("is-on", isVerifying(state));
    tally.textContent = phrase();
  }

  function phrase() {
    if (isVerifying(state)) return `Verifying ${named(state.pending.at).toLowerCase()}`;
    return remaining(state)
      ? `${remaining(state)} of ${LENGTH} still to enter`
      : `All ${LENGTH} entries verified`;
  }

  function publish() {
    for (const [field, digits] of slices(report(state))) api.set(field.name, digits);
  }

  function banks() {
    return [...slices(picks)].map(([field, mine]) =>
      el(
        "fieldset",
        { class: "bur-field" },
        el("legend", { class: "eyebrow bur-legend", text: field.label }),
        el("div", { class: "bur-cells" }, ...grouped(mine, field.group)),
      ),
    );
  }
}

function grouped(nodes, size) {
  const out = [];
  for (let at = 0; at < nodes.length; at += size)
    out.push(el("span", { class: "bur-group" }, ...nodes.slice(at, at + size)));
  return out;
}
