import { el, plaqueBlurb, plaqueMeta, plaqueTitle } from "./dom.js";
import { lookup, openingRoute } from "./registry.js";
import { replaceRoute, startRouter } from "./router.js";
import { buildRail, closeMenu, initMenu, markRail } from "./sidebar.js";
import { showExhibit } from "./stage.js";
import { initStatus } from "./status.js";
import { buildTabs, markTabs } from "./tabs.js";

const CRUELTY_MAX = 5;

let shownCategory = null;

buildRail();
initMenu();
initStatus();
startRouter(onRoute);

function onRoute(route) {
  const found = route && lookup(route.category, route.exhibit);
  if (found && !found.exhibit.soon) {
    show(found);
    return;
  }
  replaceRoute(openingRoute);
  show(lookup(openingRoute.category, openingRoute.exhibit));
}

function show({ category, exhibit }) {
  closeMenu();
  markRail(category.id);
  if (category !== shownCategory) {
    buildTabs(category);
    shownCategory = category;
  }
  markTabs(exhibit.id);
  fillPlaque(exhibit);
  document.title = `${exhibit.label} — Bad Designs`;
  showExhibit(category, exhibit);
}

function fillPlaque(exhibit) {
  plaqueTitle.textContent = exhibit.label;
  plaqueBlurb.textContent = exhibit.blurb;
  plaqueMeta.replaceChildren(
    el("span", { text: "Cruelty" }),
    pips(exhibit.cruelty),
    el("span", { "aria-hidden": true, text: "·" }),
    el("span", { text: `Opened ${opened(exhibit.added)}` }),
  );
}

function pips(cruelty) {
  const dots = Array.from({ length: CRUELTY_MAX }, (_, at) =>
    el("span", { class: at < cruelty ? "pip on" : "pip" }),
  );
  return el(
    "span",
    { class: "pips", role: "img", "aria-label": `${cruelty} out of ${CRUELTY_MAX}` },
    ...dots,
  );
}

// Split rather than parsed: an ISO date string is UTC midnight, which reads as
// the day before in every western timezone.
function opened(added) {
  const [year, month, day] = added.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
