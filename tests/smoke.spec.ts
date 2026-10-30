// Smoke tests: the page loads, the 3D view comes up, the menu works, every aircraft can be picked and flown, and the
// ultra-low (?lite) mode loads. Any console error or uncaught exception fails the run.
//
// Hermetic: the page asks cdnjs for three.js r128 and Google for fonts. Both are answered locally here, three.js from the
// identical r128 build in node_modules (three@0.128.0), so the run needs no network.
//
// Start-up builds the whole world and, in CI, renders with software WebGL (SwiftShader): about 25-30 s. So the tests
// below share one loaded page and run in order rather than reloading for each.
import { test, expect, type Page, type Browser } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const THREE_JS = readFileSync(require.resolve('three/build/three.min.js'), 'utf8');
const AIRCRAFT = ['j3', 'c180', 'c130', 'f14', 'brick'];

async function openGame(browser: Browser, path = '/') {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', r => r.fulfill({ contentType: 'text/javascript', body: THREE_JS }));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto(path);
  // the script publishes window.__rf at the very end of start-up, right after it opens the title menu
  await page.waitForFunction(() => !!(window as any).__rf, null, { timeout: 90_000 });
  return { page, errors };
}

test.describe.serial('R-Law Fly-In', () => {
  test.setTimeout(150_000);
  let page: Page, errors: string[];
  test.beforeAll(async ({ browser }) => { test.setTimeout(150_000); ({ page, errors } = await openGame(browser)); });
  test.afterAll(async () => { await page?.close(); });
  test.afterEach(() => { expect(errors, 'console errors or uncaught exceptions').toEqual([]); });

  test('title menu over a sized WebGL canvas', async () => {
    await expect(page.locator('#menu')).toBeVisible();
    await expect(page.locator('#mTitle')).toContainText('R-Law Fly-In');
    await expect(page.locator('#mStatus')).toBeHidden();   // "Loading the airfield…" is gone once start-up finished
    const box = await page.locator('canvas#view').boundingBox();
    expect(box && box.width > 0 && box.height > 0).toBeTruthy();
    expect(await page.evaluate(() => (window as any).__rf.renderer.getContext().isContextLost()), 'WebGL context alive').toBe(false);
    await page.waitForTimeout(5_000);   // let the render loop and the deferred menu thumbnails run
  });

  test('menu lists all five aircraft and each one can be selected', async () => {
    await expect(page.locator('#acsel .acb')).toHaveCount(AIRCRAFT.length);
    for (const id of AIRCRAFT) {
      const b = page.locator(`#acsel .acb[data-ac="${id}"]`);
      await b.click();
      await expect(b).toHaveAttribute('aria-checked', 'true');
      expect(await page.evaluate(() => (window as any).__rf.T.id)).toBe(id);
      await expect(page.locator('#placard div').first()).toBeVisible();
    }
  });

  for (const id of AIRCRAFT) {
    test(`${id}: short-final start runs the flight model`, async () => {
      if (await page.locator('#menu').isHidden()) await page.locator('#bMenu').click();
      await page.locator(`#acsel .acb[data-ac="${id}"]`).click();
      await page.locator('#bApproach').click();
      await expect(page.locator('#menu')).toBeHidden();
      expect(await page.evaluate(() => (window as any).__rf.state)).toBe('flying');
      const pos = () => page.evaluate(() => { const p = (window as any).__rf.ac.pos; return [p.x, p.y, p.z]; });
      const a = await pos();
      // frames are slow under software WebGL right after a start, so wait for the sim to advance rather than a fixed time
      await expect.poll(async () => { const b = await pos(); return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); },
        { message: `${id} moves along the approach`, timeout: 60_000, intervals: [500] }).toBeGreaterThan(5);
      expect(await page.evaluate(() => (window as any).__rf.ac.crashed)).toBe(false);
    });
  }
});

test('ultra-low mode (?lite) loads with no errors', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page, errors } = await openGame(browser, '/?lite');
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#tLite')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tHigh')).toBeDisabled();
  await page.waitForTimeout(3_000);
  expect(errors).toEqual([]);
  await page.close();
});
