// What the visitor has captured in the exhibit on screen, and what it has cost
// them. The shell owns this so that an exhibit only has to own its control.
// DOM-free, and one-directional: values arrive through setValue and leave
// through the subscribers.

// A position the exhibit has not committed yet. An exhibit reports its value
// as a fixed-width string and writes this wherever the visitor hasn't been.
export const BLANK = "·";

const listeners = new Set();

let fields = [];
let values = new Map();
let startedAt = 0;
let attempts = 1;

const emit = () => listeners.forEach((fn) => fn());

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function beginSession(nextFields, now = Date.now()) {
  fields = nextFields ?? [];
  values = new Map(fields.map((field) => [field.name, blankValue(field)]));
  startedAt = now;
  attempts = 1;
  emit();
}

export function restartSession(now = Date.now()) {
  values = new Map(fields.map((field) => [field.name, blankValue(field)]));
  startedAt = now;
  attempts += 1;
  emit();
}

export function setValue(name, value) {
  values.set(name, value);
  emit();
}

export function snapshot(now = Date.now()) {
  return {
    fields,
    values: new Map(values),
    attempts,
    elapsedMs: fields.length ? Math.max(0, now - startedAt) : 0,
    complete: fields.length > 0 && fields.every((f) => isComplete(f, values.get(f.name))),
  };
}

export function isComplete(field, value) {
  if (typeof value !== "string" || value.includes(BLANK)) return false;
  return field.length ? value.length === field.length : value.length > 0;
}

const blankValue = (field) => (field.length ? BLANK.repeat(field.length) : "");
