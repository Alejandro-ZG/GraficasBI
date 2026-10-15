import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4300',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4300',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--auto-accept-this-tab-capture'] },
        ...(process.env['CI'] ? {} : { channel: 'chrome' }),
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        launchOptions: { args: ['--auto-accept-this-tab-capture'] },
        ...(process.env['CI'] ? {} : { channel: 'msedge' }),
      },
    },
    ...(process.env['TEST_FIREFOX']
      ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]
      : []),
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'android-emulated', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-emulated', use: { ...devices['iPhone 13'] } },
  ],
});
