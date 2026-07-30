# CLAUDE.md

Guidance for AI agents working in this repo. User-facing docs (what the site is, how to run it, the four steps to add an exhibit) live in [README.md](README.md) — read that first; this file covers the contracts, the reasoning behind them, and the rules that hold the joke together.

## The premise, stated as an engineering constraint

The site is a museum. The exhibits are hostile; **the building is not**. Every line of shell code — navigation, layout, focus handling, announcements — is written to the standard of a site you would actually ship. The comedy comes from a perfectly good building housing perfectly awful furniture, and it collapses the moment the building itself is sloppy: a broken tab strip reads as a bug, not a bit.

Two consequences that are not negotiable:

- **Hostile is not inaccessible.** An exhibit keeps real labels, real keyboard operation and real live-region announcements. What makes it bad is the *interaction design* — how many actions a value costs, in what order, with what taken away — never the absence of an accessible name. A screen-reader user must suffer exactly as much as a sighted mouse user, no more and no less. An exhibit that is merely unusable with assistive tech isn't in the joke; it's the ordinary failure the joke is about.
- **Reduced motion removes animation, not difficulty.** `prefers-reduced-motion` turns a rolling wheel into a snapping one and an animated decay into a stepped one. It must never shorten the path to a completed value, or the setting becomes the cheat code and the exhibit stops being an exhibit.

## Architecture

No build step. Native ES modules served as they are, plain CSS, zero runtime dependencies; `public/` is the deploy artifact and the web boundary — a file outside it is repository furniture and is never served, which is why the notes and the tooling sit at the root. Everything below is convention plus a test that makes the convention loud when it is broken.

The shell is [public/js/](public/js/), where the file names are the index and each module says what it is. What a directory listing can't tell you:

- **The catalogue is data.** [registry.js](public/js/registry.js) holds every category and its exhibits' metadata and imports nothing; array order is display order, and an entry marked `soon` has no directory and nothing routes to it.
- **The route is `#/<category>/<exhibit>` and nothing else.** Parsing and formatting are pure. Anything that doesn't name a built exhibit is corrected with `replaceState` rather than pushed, so a stale link neither lands on a blank page nor leaves a step in the history to walk back through, and an in-page anchor can't restart an exhibit halfway through it.
- **The stage owns an exhibit's whole life.** It aborts the one on screen, loads the next one's stylesheet once, imports its module and mounts it; a failed import leaves a card in the stage and the rest of the site working. There is one teardown, and starting over goes through it.
- **The session runs one way.** Values arrive through `setValue` and leave through subscribers; nothing reads back out of the DOM, and the module holds none, so what the form has captured is answerable outside a browser. A position an exhibit hasn't committed is the `BLANK` character, which is what makes "complete" answerable for a control whose digits all start at zero.
- **A module that has no reason to touch the document doesn't.** Reading a global at the top of a file makes it browser-only for good, and the ones that stay out of the document are held there by a test.

### The exhibit contract

An exhibit is a directory holding `exhibit.js`, `exhibit.css`, and whatever pure logic it factors out. `exhibit.js` exports exactly two things:

```js
export const fields = [{ name: "number", label: "Card number", length: 16, group: 4 }];
export function mount(root, api) {}
```

`api` is `{ set(name, value), announce(text), signal }`. `signal` is aborted when the exhibit is torn down, so a listener registered with `{ signal }` and an animation loop that checks `signal.aborted` both clean themselves up — an exhibit needs no teardown bookkeeping of its own, and `mount` returns nothing. The contract is deliberately this small; widen it when a second exhibit proves it must, not in anticipation of one.

The module path is **derived** — `public/exhibits/<category>/<exhibit>/exhibit.js` — never stored in the registry, so it cannot drift from where the file actually is.

**An exhibit is a whole form in one design language.** A category names a form its visitors have filled in before — payment details, personal information — and each exhibit under it is a competing design for *all* of that form: card number, expiry and security code together, not one apiece. Two exhibits in a category are alternatives, never halves. So a mechanism that only suits one field isn't an exhibit; it is one field of an exhibit whose idea reaches the others too, and if the idea doesn't reach them, it isn't the exhibit's idea.

**The shell owns the form, the exhibit owns the input.** The captured values, the elapsed clock, the reset button, the submit gate and the receipt are written once in the shell and every exhibit inherits them by declaring `fields`. An exhibit that grows its own timer or its own submit button has taken something from the shell that the next exhibit will then have to re-implement. Starting over is a teardown and a fresh `mount` rather than a message, so an exhibit may keep the visitor's progress wherever it likes and has nothing to reset.

### CSS scoping

Every rule in an `exhibit.css` is scoped under `[data-exhibit="<category>/<exhibit>"]`, which the stage stamps on its container; classes inside carry a short id prefix (`.odo-*`). With no bundler there is nothing else standing between two exhibits' stylesheets, and `tests/unit/manifest.test.js` fails on a selector that escapes its own scope.

Shell CSS is a set of numbered partials linked in [public/index.html](public/index.html) in cascade order. **The `<link>` order is the cascade** — adding a partial means putting its link where its rules belong, not next to its neighbours in the directory listing. Exhibit stylesheets are not linked; [public/js/css-loader.js](public/js/css-loader.js) injects them on first use.

Design tokens live in `:root` in [public/css/01-base.css](public/css/01-base.css). Anything that needs to compose with alpha ships a paired `--x-rgb` triplet next to it. The palette is dark-only for now, but the tokens are named by role rather than by shade so a light appearance can arrive as one additive partial without touching a component rule.

## Build & verify

- `npm run lint` — ESLint over `public/js/` and `public/exhibits/`. There is no build step, so this is the only pre-runtime error check.
- `npm test` — `node --test` over `tests/unit/`. Two of those tests guard conventions rather than behaviour: `imports.test.js` pins that the DOM-free modules stay importable in bare Node (no `window`/`document` at module top level), and `manifest.test.js` cross-checks the registry against the filesystem, the CSS scoping rule and the web boundary. A convention that can be violated silently gets a test; that is the general rule here, not those two cases.
- `npm run format:check` — CI runs it, so formatter drift cannot accumulate.
- Serve with `python3 -m http.server -d public` from the repo root. Do not start a server on the user's behalf without being asked.

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
