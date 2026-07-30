// The payment form itself, which belongs to the category rather than to any one
// design of it: every exhibit here captures these three fields, and each
// re-exports this as its own `fields`.

export const fields = [
  { name: "number", label: "Card number", length: 16, group: 4, benchmarkMs: 9000 },
  { name: "expiry", label: "Expiry", length: 4, group: 2, benchmarkMs: 4000 },
  { name: "code", label: "Security code", length: 3, group: 3, benchmarkMs: 3000 },
];

export const LENGTH = fields.reduce((total, field) => total + field.length, 0);

// Each field paired with its own stretch of anything laid out one entry per
// position — a report string, a row of reels — so an exhibit that works across
// the whole form can still address it a field at a time.
export function* slices(positions) {
  let from = 0;
  for (const field of fields) {
    yield [field, positions.slice(from, from + field.length)];
    from += field.length;
  }
}
