import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3103",
    trace: "retain-on-failure",
    launchOptions: { channel: "msedge", chromiumSandbox: true },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "tablet",
      testIgnore: "**/billiard-levels.spec.ts",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "mobile",
      testIgnore: "**/billiard-levels.spec.ts",
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "landscape",
      testIgnore: "**/billiard-levels.spec.ts",
      use: {
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run start -- --port 3103",
    url: "http://127.0.0.1:3103",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
