import { defineConfig, devices } from "@playwright/test";

/**
 * Enterprise Playwright E2E Configuration
 * Cross-platform support for local Windows development and Ubuntu GitHub Actions CI.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "Mobile Safari (iPhone 13)",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
      },
    },
    {
      name: "Tablet (iPad Mini)",
      use: {
        ...devices["iPad Mini"],
        defaultBrowserType: "chromium",
      },
    },
  ],
  webServer: {
    command: process.platform === "win32" ? "npm.cmd run start" : "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
