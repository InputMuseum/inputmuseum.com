// Motion policy. Read at the start of an animation rather than once at import,
// so a visitor who changes the setting doesn't have to reload.

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// An animation the visitor opted out of arrives instantly. It still arrives:
// nothing an exhibit does to you may be skipped by changing a system setting.
export const duration = (ms) => (prefersReducedMotion() ? 0 : ms);
