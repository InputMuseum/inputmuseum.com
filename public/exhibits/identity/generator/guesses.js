// The machine's guesses at who you are. No DOM, and randomness arrives as an
// argument, so a run can be replayed exactly.
//
// Phone numbers and mail domains are drawn from the ranges reserved for
// fiction, so a generated identity can never reach a real person.

const FIRST = [
  "Adam",
  "Priya",
  "Marcus",
  "Chloe",
  "Yusuf",
  "Elena",
  "Daniel",
  "Nadia",
  "Oliver",
  "Grace",
  "Idris",
  "Maya",
  "Thomas",
  "Amara",
  "Felix",
  "Rosa",
  "Jonah",
  "Leila",
  "Callum",
  "Iris",
  "Samir",
  "Bethan",
  "Noah",
  "Farah",
];

const LAST = [
  "Abbott",
  "Bakker",
  "Chen",
  "Delgado",
  "Ellery",
  "Fontaine",
  "Grimshaw",
  "Haddad",
  "Iyer",
  "Jarvis",
  "Kowalski",
  "Lindqvist",
  "Mbeki",
  "Novak",
  "Okafor",
  "Petrov",
  "Quinn",
  "Rasmussen",
  "Sharma",
  "Thorne",
  "Ueda",
  "Vance",
  "Whitfield",
  "Ziegler",
];

const DOMAINS = ["example.com", "example.net", "example.org"];

const MAILBOX = [
  (first, last) => `${first}.${last}`,
  (first, last) => `${first[0]}${last}`,
  (first, last) => `${first}${last[0]}`,
  (first, last, random) => `${first}.${last}${10 + Math.floor(random() * 90)}`,
];

const DIALLING = [
  "07700 900",
  "020 7946 0",
  "0113 496 0",
  "0121 496 0",
  "0131 496 0",
  "0161 496 0",
];

const STREETS = [
  "Alder",
  "Beechwood",
  "Cavendish",
  "Dovecote",
  "Elmfield",
  "Foundry",
  "Granary",
  "Hawthorn",
  "Inglewood",
  "Juniper",
  "Kilnside",
  "Larkspur",
  "Maltings",
  "Nightingale",
  "Orchard",
  "Pembroke",
  "Quarry",
  "Rookery",
  "Saltmarsh",
  "Tannery",
  "Vicarage",
  "Wharfside",
];

const SUFFIXES = ["Road", "Street", "Lane", "Close", "Avenue", "Row", "Gardens", "Terrace", "Rise"];

const TOWNS = [
  "Ashcombe",
  "Barnwell",
  "Crowhurst",
  "Draycott",
  "Elmsworth",
  "Garstang",
  "Hallowfield",
  "Ilbury",
  "Kettlewell",
  "Marlbrook",
  "Netherby",
  "Oakhampton",
  "Pennington",
  "Ravensdale",
  "Stanbrook",
  "Thornbury",
];

const AREAS = ["BN", "CT", "DE", "EX", "GL", "HR", "LN", "NR", "PE", "RG", "SN", "TQ", "WR", "YO"];
const UNITS = "ABDEFGHJLNPQRSTUWXYZ";

const pick = (random, list) => list[Math.floor(random() * list.length)];
const digits = (random, count) =>
  Array.from({ length: count }, () => Math.floor(random() * 10)).join("");

const MAKE = {
  name: (random) => `${pick(random, FIRST)} ${pick(random, LAST)}`,
  email: (random) => {
    const first = pick(random, FIRST).toLowerCase();
    const last = pick(random, LAST).toLowerCase();
    return `${pick(random, MAILBOX)(first, last, random)}@${pick(random, DOMAINS)}`;
  },
  phone: (random) => `${pick(random, DIALLING)}${digits(random, 3)}`,
  address: (random) =>
    `${1 + Math.floor(random() * 180)} ${pick(random, STREETS)} ${pick(random, SUFFIXES)}, ` +
    `${pick(random, TOWNS)}, ${pick(random, AREAS)}${digits(random, 1)} ` +
    `${digits(random, 1)}${pick(random, UNITS)}${pick(random, UNITS)}`,
};

export const emptyState = (names) =>
  Object.fromEntries(names.map((name) => [name, { value: "", was: "", attempts: 0 }]));

export const generate = (state, name, random) => ({
  ...state,
  [name]: {
    value: MAKE[name](random),
    was: state[name].value,
    attempts: state[name].attempts + 1,
  },
});

// What the last two results have in common, position by position. There is
// nothing else to measure a guess against, so this is what the machine offers
// as progress.
export const matches = (value, previous) =>
  [...value].map((character, at) => character === previous[at]);
