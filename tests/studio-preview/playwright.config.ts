import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: ".", testMatch: "workbench.spec.ts", outputDir: "../../test-results/studio-workbench",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3104" },
  webServer: { command: "node tests/studio-preview/server.mjs", cwd: path.resolve(__dirname, "../.."), url: "http://127.0.0.1:3104", reuseExistingServer: false },
});
