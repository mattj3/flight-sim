# Architecture

R-Law Fly-In is one file, `index.html` (4,284 lines, 369 KB as of Oct 2026), plus `manifest.webmanifest`. There is no
build step: GitHub Pages serves the file as committed, and opening it from disk works too. Three.js r128 comes from
cdnjs; fonts come from Google Fonts.

`package.json`, `node_modules/` and `tests/` exist only for the test tooling. Nothing in them is served or loaded by the
game.

## Map of `index.html`

Line numbers are approximate and drift as the file changes; the section comments (`/* ---------- name ---------- */`)
are the stable anchors.

| Lines | Section | What is there |
| --- | --- | --- |
| 1–17 | Head | Meta, manifest, icon, font preconnects |
| 18–170 | CSS | Full-bleed canvas, HUD strip, touch controls, sectional-chart menu card |
| 171–308 | HTML shell | `canvas#view`, `#hud`, touch controls (`#left`, `#right`, `#stick`), `#menu` with aircraft, location, wind, sky and toggle controls |
| 309 | three.js | `<script src>` for r128 from cdnjs |
| 310–4283 | Game script | One IIFE; nothing is global except the `window.__rf` test hook at the end |
| 313–330 | Helpers, settings | `clamp`, `sstep`, `lerp`, unit constants, `settings` (persisted to `localStorage` under `rlaw-settings`), `?lite` detection |
| 331–457 | World | World constants, value noise (`hash2`, `vnoise`, `fbm`), roads, land cover, terrain height (`groundHeight`, 31 call sites) |
| 458–722 | Rendering setup | Renderer and scene, procedural textures, sky, terrain grid, tree chunks and `treeHit` |
| 723–857 | The strip | Runway, buildings, parked aircraft |
| 858–966 | Aircraft data | `TYPES` (all five aircraft: mass, inertia, aero coefficients, engine, gear, handling, placards) and the derived gear springs |
| 967–1782 | Exterior models | One builder per aircraft: `buildModel` (J-3), `buildModel180`, `buildModel130`, `buildModelF14`, `buildModelBrick` |
| 1783–2470 | Cockpits | Gauge drawing primitives, per-type cabins, panel artwork, the F-14 HUD, VDI, HSD and AoA indexer |
| 2471–2561 | Weather | Time of day, rain, fog |
| 2562–2700 | The Moon | Craters, lunar terrain, lander, `setWorld` |
| 2701–3012 | At sea | CVN-71 deck geometry, wires, Fresnel lens, LSO calls |
| 3013–3123 | Live instruments | `drawPanel`, `updateCockpit` |
| 3124–3144 | Wind | `WINDS`, `windVec` (wind gradient, gusts, carrier burble) |
| 3145–3462 | **Flight model** | `liftCoef`, `flapNow`, `engine` (piston, constant-speed, turboprop, jet), `sos`, `step` (the 120 Hz integrator), F-14 `sweepState`, catapult and wire forces, landing and crash logic, auto trim and `solveTrim` |
| 3463–3528 | Start positions | `resetRunway`, `resetSea`, `resetApproach` |
| 3529–3697 | Input | Keyboard, gamepad, joystick, touch stick and throttle, gear, hook, flaps, JATO |
| 3698–3751 | Camera | Cockpit, chase and flight-line views, look-around |
| 3752–3977 | HUD, smoke, guns, kids mode | Data strip, JATO smoke, ballistic rounds and tracers, target planes |
| 3978–4053 | Toast, audio | Web Audio engine, wind and stall sounds |
| 4054–4221 | Menu and state | `openMenu`, `begin`, aircraft thumbnails, `setType`, location and weather selectors, quality and resize |
| 4222–4283 | Main loop | `frame`: fixed 1/120 s physics steps, then render; `window.__rf` hook; start-up |

## How a frame runs

`frame(now)` is driven by `requestAnimationFrame`. While flying it reads input once, then runs `step(1/120)` as many
times as the elapsed time needs (at most 12 per frame), so the physics rate does not depend on the display rate. Then it
updates control-surface animation, smoke, guns, targets, camera, trees, carrier, weather, the HUD and audio, and
renders the world scene and, in cockpit view, the cockpit scene on top with a near clip plane of 2 cm.

## Tests

| Suite | What it covers | How it reaches the code |
| --- | --- | --- |
| `tests/physics.test.mjs` (`node --test`) | Aircraft table, derived gear, lift curve, all four engine types, speed of sound, F-14 sweep schedule, noise determinism | `tests/lib/extract.mjs` parses the game script with acorn and evaluates only the named top-level declarations in a Node `vm` context with the real three.js r128. No edits to `index.html` |
| `tests/smoke.spec.ts` (Playwright, Chromium) | Page loads with no console errors, WebGL is up, every aircraft can be selected and flown from short final, `?lite` loads | Serves the repo root as Pages does; cdnjs and Google Fonts are answered locally so the run is hermetic |

The physics tests are characterisation tests: they record today's outputs. A deliberate retune updates them in the
same commit.

## Should it be split into modules?

**Recommendation: not now.** Keep the single file, and revisit if a second person starts contributing regularly.

The case for splitting into ES modules (`<script type="module">`, one file per section above, still no bundler):

- Diffs and reviews get smaller; the 600–700-character data lines would sit in their own files.
- The flight model could be imported directly by tests instead of extracted by name.
- Editors and linters work better on files under 1,000 lines.

The case against, which wins for now:

- **`file://` stops working.** Browsers block module imports from `file://`, so double-clicking `index.html` would
  show a blank page. Today it works offline from disk.
- One file is the project's identity: one URL, view-source shows everything, nothing to build or bundle.
- The author ships many small changes a day; a split would conflict with all of them and move every line in `git blame`.
- The test harness already gives the main benefit of a split (testing the physics in isolation) without it.

If it is split later, the low-risk order is: aircraft data (`TYPES`) first, then the flight model, then the exterior
models, each as a pure move with the characterisation tests and the smoke test green before and after.

## Known follow-ups

- **Subresource Integrity** on the three.js `<script>` tag. Needs the hash computed from a verified copy of the cdnjs
  file; not done here because the build environment could not fetch cdnjs to verify it.
- **Offline PWA.** The manifest exists but there is no service worker, and fonts and three.js load from third-party
  hosts, so the installed app needs a network connection.
- **three.js r128** is from 2021. Upgrading is a real project (lighting and colour-management defaults changed in
  r152 and r155) and should be its own change, gated by the smoke test and a play-through.
