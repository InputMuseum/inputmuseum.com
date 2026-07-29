import { plaqueBlurb, plaqueMeta, plaqueTitle, stage } from "./dom.js";
import { el } from "./el.js";
import { lookup, openingRoute } from "./registry.js";
import { formatRoute, replaceRoute, startRouter } from "./router.js";
import { buildRail, closeMenu, initMenu, markRail } from "./sidebar.js";
import { showExhibit } from "./stage.js";
import { initStatus } from "./status.js";
import { buildTabs, markTabs } from "./tabs.js";

const CRUELTY_MAX = 5;

let shown = null;

buildRail();
initMenu();
initStatus();
initSkipLink();
startRouter(onRoute);

function onRoute(route) {
  const found = route && lookup(route.category, route.exhibit);
  // Anything that doesn't name a built exhibit leaves the visitor where they
  // are, so an in-page anchor can't restart an exhibit halfway through it.
  const target =
    found && !found.exhibit.soon
      ? found
      : (shown ?? lookup(openingRoute.category, openingRoute.exhibit));

  const wanted = { category: target.category.id, exhibit: target.exhibit.id };
  if (location.hash !== formatRoute(wanted)) replaceRoute(wanted);
  if (target.exhibit !== shown?.exhibit) show(target);
}

function show(target) {
  const { category, exhibit } = target;
  closeMenu();
  markRail(category.id);
  if (category !== shown?.category) buildTabs(category);
  markTabs(exhibit.id);
  fillPlaque(exhibit);
  document.title = `${exhibit.label} — Bad Designs`;
  shown = target;
  showExhibit(category, exhibit);
}

// The href is what works without scripts; with them, focus moves without a
// history entry nobody wants to walk back through.
function initSkipLink() {
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    stage.focus();
  });
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
