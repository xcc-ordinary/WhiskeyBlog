import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
export default defineConfig({ testDir: "./tests/e2e", use: { ...devices["Desktop Chrome"], baseURL }, webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI } });
