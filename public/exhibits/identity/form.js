// The personal-information form itself, which belongs to the category rather
// than to any one design of it: every exhibit here captures these four fields,
// and each re-exports this as its own `fields`.

export const fields = [
  { name: "name", label: "Full name", benchmarkMs: 4000 },
  { name: "email", label: "Email address", benchmarkMs: 7000 },
  { name: "phone", label: "Phone number", benchmarkMs: 6000 },
  { name: "address", label: "Address", benchmarkMs: 12000 },
];
