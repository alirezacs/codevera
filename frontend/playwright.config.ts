import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";
process.env.CODEVERA_TEST_ADMIN_PASSWORD ??= randomBytes(24).toString("base64url");
export default defineConfig({
  testDir: "./tests/browser",

  timeout: 90000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    screenshot: "only-on-failure",
  },
  webServer: [{ command: "npm run test:serve --prefix ../codevera-nest", url: "http://127.0.0.1:4100/api/v1/health", reuseExistingServer: false, timeout: 60000 }, {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { CODEVERA_API_URL: "http://127.0.0.1:4100/api/v1" },
  }],
});
