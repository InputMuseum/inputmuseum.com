import { tabList } from "./dom.js";
import { el } from "./el.js";
import { prefersReducedMotion } from "./motion.js";
import { formatRoute } from "./router.js";

export function buildTabs(category) {
  tabList.replaceChildren(
    ...category.exhibits.map((exhibit) => el("li", {}, tabEntry(category, exhibit))),
  );
}

export function markTabs(exhibitId) {
  for (const tab of tabList.querySelectorAll("[data-exhibit]")) {
    if (tab.dataset.exhibit !== exhibitId) {
      tab.removeAttribute("aria-current");
      continue;
    }
    tab.setAttribute("aria-current", "page");
    // once a category runs to a dozen exhibits the current one is often off
    // the end of the strip
    tab.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }
}

function tabEntry(category, exhibit) {
  if (exhibit.soon)
    return el(
      "span",
      { class: "tab tab-soon" },
      el("span", { text: exhibit.label }),
      el("span", { class: "badge", text: "soon" }),
    );

  const href = formatRoute({ category: category.id, exhibit: exhibit.id });
  return el("a", { class: "tab", href, "data-exhibit": exhibit.id, text: exhibit.label });
}
