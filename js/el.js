// The element builder everything constructs its DOM with. Kept apart from the
// shell's cached references so that importing it costs nothing — an exhibit
// module reaches for this and stays readable outside a browser.

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
