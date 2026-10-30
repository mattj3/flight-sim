import { defineConfig, devices } from '@playwright/test';

// Smoke tests load the real index.html in Chromium. three.js and Google Fonts are served locally by route handlers in
// the spec (see tests/smoke.spec.ts), so the run is hermetic: no network, same result locally and in CI.
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } },
  }],
  webServer: {
    command: 'node tests/serve.mjs',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
});
