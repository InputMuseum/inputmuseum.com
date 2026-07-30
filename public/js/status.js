import { announce } from "./announce.js";
import { receipt, receiptBody, resetBtn, statusClock, statusFields, submitBtn } from "./dom.js";
import { el } from "./el.js";
import { BLANK, snapshot, subscribe } from "./session.js";
import { restartExhibit } from "./stage.js";

const TICK_MS = 1000;

export function initStatus() {
  subscribe(render);
  setInterval(renderClock, TICK_MS);
  resetBtn.addEventListener("click", () => {
    restartExhibit();
    announce("Cleared. Start again.");
  });
  submitBtn.addEventListener("click", showReceipt);
  render();
}

function render() {
  const { fields, values, complete } = snapshot();
  statusFields.replaceChildren(
    ...fields.map((field) => {
      const value = values.get(field.name) ?? "";
      return el(
        "div",
        { class: "st-field" },
        el("span", { class: "st-label", text: field.label }),
        el("output", {
          class: value.includes(BLANK) ? "st-value is-empty" : "st-value",
          text: group(field, value),
        }),
      );
    }),
  );
  submitBtn.disabled = !complete;
  renderClock();
}

function renderClock() {
  statusClock.textContent = clock(snapshot().elapsedMs);
}

function showReceipt() {
  const { fields, values, elapsedMs, attempts } = snapshot();
  const benchmarkMs = fields.reduce((total, field) => total + (field.benchmarkMs ?? 0), 0);

  receiptBody.replaceChildren(
    ...fields.map((field) =>
      el(
        "div",
        { class: "rc-field" },
        el("span", { class: "st-label", text: field.label }),
        el("strong", { text: group(field, values.get(field.name)) }),
      ),
    ),
    el("p", {
      text:
        `Captured in ${spell(elapsedMs)}` + (attempts > 1 ? `, over ${attempts} attempts.` : "."),
    }),
    benchmarkMs
      ? el("p", {
          text: `A form you can type into takes about ${Math.round(benchmarkMs / 1000)} seconds.`,
        })
      : null,
  );
  receipt.showModal();
  announce(`Captured in ${spell(elapsedMs)}.`);
}

function group(field, value = "") {
  if (!field.group) return value;
  const chunks = [];
  for (let at = 0; at < value.length; at += field.group)
    chunks.push(value.slice(at, at + field.group));
  return chunks.join(" ");
}

function clock(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function spell(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds || !minutes) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
}
