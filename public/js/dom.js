// Cached references to the static shell, and the browser handles it reads.

export const $ = (id) => document.getElementById(id);

export const narrowMQ = window.matchMedia("(max-width: 860px)"); // keep in sync with the CSS breakpoint

export const menuBtn = $("menuBtn"),
  rail = $("rail"),
  railList = $("railList"),
  scrim = $("scrim");
export const tabList = $("tabList");
export const plaqueTitle = $("plaqueTitle"),
  plaqueLabel = $("plaqueLabel"),
  plaqueBlurb = $("plaqueBlurb"),
  plaqueMeta = $("plaqueMeta");
export const stage = $("stage");
export const statusFields = $("statusFields"),
  statusClock = $("statusClock"),
  resetBtn = $("resetBtn"),
  submitBtn = $("submitBtn");
export const receipt = $("receipt"),
  receiptBody = $("receiptBody");
