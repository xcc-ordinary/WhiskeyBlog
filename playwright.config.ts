import { defineConfig, devices } from "@playwright/test";
const localPort = 3101;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${localPort}`;
export default defineConfig({ testDir: "./tests/e2e", use: { ...devices["Desktop Chrome"], baseURL }, webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: `npm run dev -- --port ${localPort}`, url: baseURL, reuseExistingServer: false } });
