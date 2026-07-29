# CLAUDE.md

Guidance for AI agents working in this repo. User-facing docs (what the site is, how to run it, the four steps to add an exhibit) live in [README.md](README.md) — read that first; this file covers the contracts, the reasoning behind them, and the rules that hold the joke together.

## The premise, stated as an engineering constraint

The site is a museum. The exhibits are hostile; **the building is not**. Every line of shell code — navigation, layout, focus handling, announcements — is written to the standard of a site you would actually ship. The comedy comes from a perfectly good building housing perfectly awful furniture, and it collapses the moment the building itself is sloppy: a broken tab strip reads as a bug, not a bit.

Two consequences that are not negotiable:

- **Hostile is not inaccessible.** An exhibit keeps real labels, real keyboard operation and real live-region announcements. What makes it bad is the *interaction design* — how many actions a value costs, in what order, with what taken away — never the absence of an accessible name. A screen-reader user must suffer exactly as much as a sighted mouse user, no more and no less. An exhibit that is merely unusable with assistive tech isn't in the joke; it's the ordinary failure the joke is about.
- **Reduced motion removes animation, not difficulty.** `prefers-reduced-motion` turns a rolling wheel into a snapping one and an animated decay into a stepped one. It must never shorten the path to a completed value, or the setting becomes the cheat code and the exhibit stops being an exhibit.

## Architecture

No build step. Native ES modules served as they are, plain CSS, zero runtime dependencies; the repository root is the deploy artifact. Everything below is convention plus a test that makes the convention loud when it is broken.

- [js/registry.js](js/registry.js) — the catalogue as pure data: `CATEGORIES`, each holding its exhibits' metadata. No imports, no side effects, importable in bare Node. Array order is display order.
- [js/router.js](js/router.js) — `#/<category>/<exhibit>` and nothing else. `parseRoute`/`formatRoute` are pure; the DOM-facing half starts the listener and resolves an unknown route to the first exhibit via `replaceState`, so a stale link never lands on a blank page.
- [js/stage.js](js/stage.js) — the exhibit lifecycle: abort the previous one, load its CSS once, dynamically import its module, mount it. An import failure renders a card in the stage and leaves the rest of the site working.
- [js/session.js](js/session.js) — what the visitor has captured in the current exhibit, the clock, the attempt count. DOM-free, so it is unit-tested in bare Node; it announces itself with a `session-changed` window event and the readouts listen. One direction only: nothing reads back out of the DOM.
- [js/sidebar.js](js/sidebar.js), [js/tabs.js](js/tabs.js), [js/status.js](js/status.js) — the three views built from the registry and the session.

### The exhibit contract

An exhibit is a directory holding `exhibit.js`, `exhibit.css`, and whatever pure logic it factors out. `exhibit.js` exports exactly two things:

```js
export const fields = [{ name: "number", label: "Card number", length: 16, group: 4 }];
export function mount(root, api) {}
```

`api` is `{ set(name, value), announce(text), signal }`. `signal` is aborted when the exhibit is torn down, so a listener registered with `{ signal }` and an animation loop that checks `signal.aborted` both clean themselves up — an exhibit needs no teardown bookkeeping of its own, and `mount` returns nothing. The contract is deliberately this small; widen it when a second exhibit proves it must, not in anticipation of one.

The module path is **derived** — `exhibits/<category>/<exhibit>/exhibit.js` — never stored in the registry, so it cannot drift from where the file actually is.

**The shell owns the form, the exhibit owns the input.** The captured values, the elapsed clock, the reset button, the submit gate and the receipt are written once in the shell and every exhibit inherits them by declaring `fields`. An exhibit that grows its own timer or its own submit button has taken something from the shell that the next exhibit will then have to re-implement.

### CSS scoping

Every rule in an `exhibit.css` is scoped under `[data-exhibit="<category>/<exhibit>"]`, which the stage stamps on its container; classes inside carry a short id prefix (`.odo-*`). With no bundler there is nothing else standing between two exhibits' stylesheets, and `tests/unit/manifest.test.js` fails on a selector that escapes its own scope.

Shell CSS is a set of numbered partials linked in [index.html](index.html) in cascade order. **The `<link>` order is the cascade** — adding a partial means putting its link where its rules belong, not next to its neighbours in the directory listing. Exhibit stylesheets are not linked; [js/css-loader.js](js/css-loader.js) injects them on first use.

Design tokens live in `:root` in [css/01-base.css](css/01-base.css). Anything that needs to compose with alpha ships a paired `--x-rgb` triplet next to it. The palette is dark-only for now, but the tokens are named by role rather than by shade so a light appearance can arrive as one additive partial without touching a component rule.

## Build & verify

- `npm run lint` — ESLint over `js/` and `exhibits/`. There is no build step, so this is the only pre-runtime error check.
- `npm test` — `node --test` over `tests/unit/`. Two of those tests guard conventions rather than behaviour: `imports.test.js` pins that the DOM-free modules stay importable in bare Node (no `window`/`document` at module top level), and `manifest.test.js` cross-checks the registry against the filesystem and the CSS scoping rule. A convention that can be violated silently gets a test; that is the general rule here, not those two cases.
- `npm run format:check` — CI runs it, so formatter drift cannot accumulate.
- Serve with `python3 -m http.server` at the repo root. Do not start a server on the user's behalf without being asked.

## Conventions

- One concern per commit; split bundled diffs before committing.
- Commit subjects are single-line and imperative, with no prefixes — no task ids, no `feat:`/`fix:`.
- Prose files (README, this file, IDEAS.md) are never manually line-wrapped — let lines run long.
- A user-facing change ships its docs in the same commit; documenting it is part of the same concern, not a follow-up.
- An exhibit's own copy — its wall label, its control labels, its error prose — is written in the voice of the fictional designer who thought it was a good idea: helpful, confident, wrong. Never wink at the reader. The site's chrome speaks plainly; the exhibit speaks like a product.
- Prettier owns js/css/html formatting (`.prettierrc`: printWidth 100, defaults otherwise; Markdown keeps its own format). The version is pinned exactly because output is version-dependent — bump it deliberately: upgrade, reformat the tree in a dedicated commit, and add that commit to `.git-blame-ignore-revs`.
- Format only the staged files before each commit, so the commit doesn't drag in formatter drift from unrelated files:
  ```
  git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(js|css|html)$' | xargs -r npx prettier --write
  ```
  then re-stage what Prettier changed. Never run whole-tree `npm run format` as part of a normal commit — that belongs in its own dedicated commit.

### Code comments

- **Default to no comment**: A comment earns its place only by recording a durable *why* the code can't show: an invariant, a constraint, a non-obvious trade-off. Keep them generic enough that a routine change doesn't force a comment edit — put a per-item note *inline on the item*, never in a const-doc that re-describes the set's members (that rots the moment you add one). Don't name consumers or other modules ("used by X", "the status strip reads this"); don't restate a constant's value or units. Comment footprint matches code footprint — a concern touched at one line gets one comment there, not a header paragraph. Before committing, reread each comment and cut any that restates the code, names something that could be renamed, or would lie after a tune or refactor — an absent comment never goes stale.
- **No inter-diff comments**: Comments describe the code as it is now, not how it got here. Don't write "extracted from X", "moved from Y", "was previously in Z". A reader who has never seen the git history should find every comment meaningful.
- **Peer items get peer prose**: When a comment or code block enumerates parallel items — sibling exhibits, switch cases, repeated setup blocks — treat them uniformly. Don't attach a justifying clause to one item while its siblings carry none: the asymmetry falsely flags that item as special, and the odd one out is invariably the one just added, meaning the sentence is a diff justification aimed at the reviewer rather than a description aimed at the reader. Test: would the prose look the same if every item had been written on the same day, by one author? If your addition carries a defense its peers lack, delete the defense.
- **Cruelty gets a comment, mechanism doesn't**: The one thing a reader genuinely cannot infer from an exhibit's code is which parts are deliberate. A constant that exists to make the control worse says so in a few words; the rAF loop that animates it says nothing.
