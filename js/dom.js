// Cached references to the static shell, and the two helpers everything builds
// its DOM with.

export const $ = (id) => document.getElementById(id);

export const narrowMQ = window.matchMedia("(max-width: 860px)"); // keep in sync with the CSS breakpoint

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...children.filter((child) => child != null));
  return node;
}

export const menuBtn = $("menuBtn"),
  rail = $("rail"),
  railList = $("railList"),
  scrim = $("scrim");
export const tabList = $("tabList");
export const plaqueTitle = $("plaqueTitle"),
  plaqueBlurb = $("plaqueBlurb"),
  plaqueMeta = $("plaqueMeta");
export const stage = $("stage");
export const statusFields = $("statusFields"),
  statusClock = $("statusClock"),
  resetBtn = $("resetBtn"),
  submitBtn = $("submitBtn");
export const receipt = $("receipt"),
  receiptBody = $("receiptBody");
