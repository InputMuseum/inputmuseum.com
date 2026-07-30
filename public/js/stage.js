import { announce } from "./announce.js";
import { loadCssOnce } from "./css-loader.js";
import { stage } from "./dom.js";
import { el } from "./el.js";
import { exhibitAsset } from "./registry.js";
import { beginSession, setValue } from "./session.js";

let live = null;

export async function showExhibit(category, exhibit) {
  live?.abort();
  const { signal } = (live = new AbortController());

  stage.replaceChildren();
  stage.dataset.exhibit = `${category.id}/${exhibit.id}`;

  const url = (file) =>
    new URL(`../${exhibitAsset(category.id, exhibit.id, file)}`, import.meta.url).href;
  loadCssOnce(url("exhibit.css"));

  let module;
  try {
    module = await import(url("exhibit.js"));
  } catch (error) {
    console.error(`[stage] ${category.id}/${exhibit.id} failed to load:`, error);
    if (!signal.aborted) stage.replaceChildren(failureCard());
    return;
  }
  if (signal.aborted) return;

  beginSession(module.fields);
  module.mount(stage, { set: setValue, announce, signal });
}

const failureCard = () =>
  el(
    "div",
    { class: "stage-error" },
    el("h2", { text: "This exhibit failed to load" }),
    el("p", {
      text: "Which is at least a familiar experience. The rest of the gallery is unaffected.",
    }),
  );
