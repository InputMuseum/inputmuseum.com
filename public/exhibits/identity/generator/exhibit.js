import { el } from "../../../js/el.js";
import { fields } from "../form.js";
import { emptyState, generate, matches } from "./guesses.js";

export { fields };

export function mount(root, api) {
  let state = emptyState(fields.map((field) => field.name));

  const readouts = new Map();
  const tallies = new Map();

  const blocks = fields.map((field) => {
    const value = el("output", {
      class: "gen-value",
      id: `gen-${field.name}`,
      // an <output> is a live region of its own; the announcer is the one voice
      // here, and it has the whole sentence to say
      "aria-live": "off",
    });
    const go = el("button", {
      class: "btn btn-primary",
      type: "button",
      "aria-label": `Generate ${article(field.label)} ${field.label.toLowerCase()}`,
      text: "Generate",
    });
    const tally = el("p", { class: "tally" });

    readouts.set(field.name, value);
    tallies.set(field.name, tally);
    go.addEventListener("click", () => press(field), { signal: api.signal });

    return el(
      "div",
      { class: "gen-field" },
      el("label", { class: "eyebrow", for: value.id, text: field.label }),
      el("div", { class: "actions" }, value, go),
      tally,
    );
  });

  root.append(
    el(
      "div",
      { class: "plinth gen" },
      ...blocks,
      el("p", {
        class: "hint",
        text: "Every result is matched against the one before it, character by character. The figures climb as the generator narrows in on you.",
      }),
    ),
  );

  fields.forEach(render);

  function press(field) {
    state = generate(state, field.name, Math.random);
    const slot = state[field.name];
    api.set(field.name, slot.value);
    render(field);
    api.announce(`${field.label}: ${slot.value}. ${phrase(slot, agreed(slot))}.`);
  }

  function render(field) {
    const slot = state[field.name];
    const marks = matches(slot.value, slot.was);
    readouts
      .get(field.name)
      .replaceChildren(
        ...(slot.value
          ? [...slot.value].map((character, at) =>
              el("span", { class: marks[at] ? "gen-char is-match" : "gen-char", text: character }),
            )
          : [el("span", { class: "gen-none", text: "Not generated yet" })]),
      );
    tallies.get(field.name).textContent = phrase(slot, agreed(slot));
  }
}

const agreed = (slot) => matches(slot.value, slot.was).filter(Boolean).length;

const phrase = (slot, matched) => {
  if (!slot.attempts) return "No attempts yet";
  if (!slot.was) return `Attempt ${slot.attempts}, nothing to match it against yet`;
  return `Attempt ${slot.attempts}, matched ${matched} of ${slot.value.length} characters`;
};

const article = (label) => (/^[aeiou]/i.test(label) ? "an" : "a");
