// An exhibit's stylesheet is fetched the first time someone opens it and then
// left in the document, so returning to it costs nothing.

const loaded = new Set();

export function loadCssOnce(href) {
  if (loaded.has(href)) return;
  loaded.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}
