# Contributing

Thanks for flying it. Bug reports with your device, browser and aircraft are the most useful thing you can send; use the
**Bug report** issue template.

## Running it

Open `index.html` in a browser, or run `npm run serve` and go to http://localhost:4173. There is no build step. Add
`?lite` to the address for ultra-low mode.

## Running the tests

```bash
npm ci
npm test             # physics characterisation tests, then the browser smoke test
```

The smoke test uses Playwright's Chromium (`npx playwright install chromium` once, if you have not used Playwright
before). It serves three.js and the fonts locally, so it works offline.

## Rules for changes

- The game stays one self-contained `index.html` with no build step.
- No change to flight-model numbers or behaviour without saying so in the PR. If you retune something on purpose, update
  the expected values in `tests/physics.test.mjs` in the same PR and explain why.
- Do not reformat `index.html`. Keep diffs to the lines you mean to change.
- `npm test` must pass, and fly the change yourself before opening the PR: tests catch errors, not handling.

## What a good PR looks like

One change, a sentence on why, how you tested it (which aircraft, which location, phone or desktop), and a screenshot if
it is visible.
