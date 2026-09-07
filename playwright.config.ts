import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'Mobile 390x844',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Narrow Mobile 320px',
      use: {
        viewport: { width: 320, height: 640 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Desktop 1280x720',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'pnpm preview --port 4173 --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
