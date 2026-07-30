// #/<category>/<exhibit>, and nothing else. Nothing here touches the DOM until
// it is called, so reading a route costs no environment.

const ROUTE = /^#?\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/;

export function parseRoute(hash) {
  const match = ROUTE.exec(hash ?? "");
  return match ? { category: match[1], exhibit: match[2] } : null;
}

export const formatRoute = (route) => `#/${route.category}/${route.exhibit}`;

export function startRouter(onRoute) {
  const go = () => onRoute(parseRoute(location.hash));
  window.addEventListener("hashchange", go);
  go();
}

// A route that doesn't resolve is corrected rather than appended, so walking
// back through history doesn't land on it again.
export function replaceRoute(route) {
  history.replaceState(null, "", formatRoute(route));
}
