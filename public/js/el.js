// The element builder everything constructs its DOM with. It caches nothing
// and reads nothing from the document, so importing it costs no environment
// and only calling it needs one.

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
