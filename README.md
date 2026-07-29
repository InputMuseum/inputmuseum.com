# Bad Designs

A gallery of input designs that work perfectly and are terrible to use.

Every exhibit is a real, working control that captures a real value — a card number, a date of birth, a phone number. None of them are broken. They are simply designed by someone who has never had to fill in a form and never will. The chrome around them is the opposite: a quiet museum that is fast, keyboard-operable and accessible, because the joke only lands if the building itself is well made.

Nothing you type is transmitted anywhere. There is no server, no analytics and no storage — the values you enter live in a JavaScript object until you close the tab.

## Running it

Pure HTML, CSS and vanilla JavaScript. No frameworks, no build step, no dependencies.

```
python3 -m http.server
```

then open http://localhost:8000. The repository root is the site — what you serve locally is byte-for-byte what GitHub Pages deploys.

## How it is put together

| Piece | Where |
| --- | --- |
| The shell (sidebar, tabs, stage, status strip) | `index.html`, `css/`, `js/` |
| The catalogue | `js/registry.js` — categories and their exhibits, as pure data |
| The exhibits | `exhibits/<category>/<exhibit>/` — one directory each |

The shell owns everything an exhibit shouldn't have to care about: navigation, the captured values, the elapsed clock, reset and submit. An exhibit owns exactly one thing — a hostile way to enter a value — and reports what it captured back to the shell.

Adding one is four steps, none of which touch the shell's logic:

1. Create `exhibits/<category>/<exhibit-id>/exhibit.js`, exporting `fields` and `mount(root, api)`.
2. Style it in a sibling `exhibit.css`, with every rule scoped under `[data-exhibit="<category>/<exhibit-id>"]`.
3. Add one entry to `CATEGORIES` in `js/registry.js`.
4. Run `npm test` — the manifest test tells you if you got any of it wrong.

`CLAUDE.md` has the full contract and the reasoning behind it.

## Checks

```
npm run format:check && npm run lint && npm test
```

Which is what CI runs on every push.
