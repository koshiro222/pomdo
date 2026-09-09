import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev:e2e',
    url: 'http://localhost:8788/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      E2E_TEST_MODE: 'true',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'e2e-local-only-secret-change-me',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'e2e-client-id',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'e2e-client-secret',
    },
  },
})
