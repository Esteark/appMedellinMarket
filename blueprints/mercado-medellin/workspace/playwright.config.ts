import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// El servidor de prueba (next start) lee .env.local por su cuenta; esto es para los specs
// que consulten Supabase local directamente.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PUERTO = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/blueprints/**", "**/data/**"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm build && pnpm start --port ${PUERTO}`,
    url: `http://127.0.0.1:${PUERTO}/api/salud`,
    reuseExistingServer: false,
    timeout: 300000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
