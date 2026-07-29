// The catalogue. Metadata only — an exhibit's behavior lives in its own
// directory and is loaded when someone opens it.
// Environment-free on purpose: this module must stay importable outside the
// browser (the unit tests run it in bare Node).
//
// An entry marked `soon` is announced but not built: it has no directory, and
// nothing routes to it.

export const CATEGORIES = [
  {
    id: "payment",
    label: "Payment details",
    blurb: "Sixteen digits. How hard could it be?",
    exhibits: [
      {
        id: "odometer",
        label: "The Odometer",
        blurb:
          "Card entry rebuilt around the place-value system, so that each digit is addressed by the quantity it represents rather than by where it happens to sit.",
        cruelty: 4,
        added: "2026-07-29",
      },
      { id: "expiry-roulette", label: "Expiry Roulette", soon: true },
      { id: "cvv-endurance", label: "CVV Endurance", soon: true },
    ],
  },
  {
    id: "identity",
    label: "Personal information",
    blurb: "Your name, chosen from everybody's.",
    exhibits: [{ id: "name-picker", label: "The Name Picker", soon: true }],
  },
  {
    id: "dates",
    label: "Dates",
    blurb: "A birthday is a point on a line.",
    exhibits: [{ id: "timeline", label: "The Timeline", soon: true }],
  },
  {
    id: "consent",
    label: "Consent",
    blurb: "Rejecting is available, and encouraged.",
    exhibits: [{ id: "reject-all", label: "Reject All", soon: true }],
  },
];

const BY_ROUTE = new Map();
for (const category of CATEGORIES)
  for (const exhibit of category.exhibits)
    BY_ROUTE.set(`${category.id}/${exhibit.id}`, { category, exhibit });

export const lookup = (categoryId, exhibitId) => BY_ROUTE.get(`${categoryId}/${exhibitId}`) ?? null;

export const isBuilt = (category) => category.exhibits.some((e) => !e.soon);

export const openingRoute = (() => {
  for (const [, { category, exhibit }] of BY_ROUTE)
    if (!exhibit.soon) return { category: category.id, exhibit: exhibit.id };
  return null;
})();

// Derived rather than stored, so an entry can't name a file that isn't there.
export const exhibitAsset = (categoryId, exhibitId, file) =>
  `exhibits/${categoryId}/${exhibitId}/${file}`;
