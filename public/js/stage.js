import { announce, silence } from "./announce.js";
import { loadCssOnce } from "./css-loader.js";
import { stage } from "./dom.js";
import { el } from "./el.js";
import { exhibitAsset } from "./registry.js";
import { beginSession, restartSession, setValue } from "./session.js";

let live = null;
let showing = null;

export async function showExhibit(category, exhibit) {
  const signal = clear();
  showing = null;
  stage.dataset.exhibit = `${category.id}/${exhibit.id}`;

  const url = (file) =>
    new URL(`../${exhibitAsset(category.id, exhibit.id, file)}`, import.meta.url).href;
  loadCssOnce(url("exhibit.css"));

  let module;
  try {
    module = await import(url("exhibit.js"));
  } catch (error) {
    console.error(`[stage] ${category.id}/${exhibit.id} failed to load:`, error);
    if (!signal.aborted) {
      beginSession([]);
      stage.replaceChildren(failureCard());
    }
    return;
  }
  if (signal.aborted) return;

  showing = module;
  beginSession(module.fields);
  mount(module, signal);
}

// An exhibit holds what the visitor has done to it in its own closure, so
// starting over builds it again rather than asking it to undo itself.
export function restartExhibit() {
  if (!showing) {
    restartSession();
    return;
  }
  const signal = clear();
  restartSession();
  mount(showing, signal);
}

function clear() {
  live?.abort();
  silence();
  stage.replaceChildren();
  return (live = new AbortController()).signal;
}

const mount = (module, signal) => module.mount(stage, { set: setValue, announce, signal });

const failureCard = () =>
  el(
    "div",
    { class: "stage-error" },
    el("h2", { text: "This exhibit failed to load" }),
    el("p", {
      text: "Which is at least a familiar experience. The rest of the gallery is unaffected.",
    }),
  );
