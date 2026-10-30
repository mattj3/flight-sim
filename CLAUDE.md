# R-Law Fly-In

Browser flight sim in one file, `index.html` (Three.js r128 from cdnjs, no build step). Served by GitHub Pages from `main`.

## Hard rule

Do not change any number, formula or behaviour in the flight model, rendering or controls unless the task explicitly asks
for that change. Refactors, tooling and docs must leave the game identical. If a refactor seems to need a behaviour
change, stop and ask.

## Commands

- Install test tooling: `npm ci`
- Physics characterisation tests: `npm run test:physics` (Node only, under a second)
- Browser smoke test: `npm run test:smoke` (Playwright + Chromium, 5–7 minutes: start-up and frames are slow under software WebGL)
- Both: `npm test`
- Serve locally: `npm run serve`, then open http://localhost:4173

## Conventions

- Keep the game a single self-contained `index.html`. No bundler, no framework, no new runtime dependencies.
- Do not run Prettier or any formatter over `index.html`; its long lines are deliberate data tables.
- The physics tests find code by declaration name (`tests/lib/extract.mjs`). If you rename a tested function, update the
  test in the same commit. If you deliberately retune the model, update the expected values and say so in the message.
- `window.__rf` at the end of the script is the test hook. Keep it.
- See `docs/ARCHITECTURE.md` for the section map.
