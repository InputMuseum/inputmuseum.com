import { CATEGORIES, isBuilt } from "./registry.js";
import { el, menuBtn, narrowMQ, rail, railList, scrim } from "./dom.js";
import { formatRoute } from "./router.js";

export function buildRail() {
  railList.append(...CATEGORIES.map((category) => el("li", {}, railEntry(category))));
}

export function markRail(categoryId) {
  for (const item of railList.querySelectorAll("[data-category]")) {
    if (item.dataset.category === categoryId) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }
}

function railEntry(category) {
  const built = category.exhibits.filter((exhibit) => !exhibit.soon);
  const label = el(
    "span",
    { class: "rail-label" },
    el("span", { text: category.label }),
    built.length
      ? el("span", { class: "rail-count", text: String(built.length) })
      : el("span", { class: "badge", text: "soon" }),
  );
  const blurb = el("span", { class: "rail-blurb", text: category.blurb });

  if (!isBuilt(category)) return el("span", { class: "rail-item rail-soon" }, label, blurb);

  const href = formatRoute({ category: category.id, exhibit: built[0].id });
  return el("a", { class: "rail-item", href, "data-category": category.id }, label, blurb);
}

export function initMenu() {
  menuBtn.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  scrim.addEventListener("click", () => setOpen(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  narrowMQ.addEventListener("change", () => setOpen(false));
  setOpen(false);
}

export const closeMenu = () => setOpen(false);

function setOpen(open) {
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
  scrim.hidden = !open;
  // sliding the rail off-screen would otherwise leave its links focusable
  rail.inert = narrowMQ.matches && !open;
  if (!open && rail.contains(document.activeElement)) menuBtn.focus();
}
