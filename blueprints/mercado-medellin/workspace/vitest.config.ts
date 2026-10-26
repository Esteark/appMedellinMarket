import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest no lee .env.local por su cuenta. Se carga aquí, una sola vez, antes de crear los
// workers (heredan process.env). Lo genera `pnpm env:local` desde Supabase local (paso 2).
// Las pruebas unitarias no lo necesitan; las de integración fallan con un error claro sin él.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    // Misma convención que tsconfig.json "paths": `@/x` → `src/x`, sin extensión.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "blueprints/**", "data/**", "tests/e2e/**"],
    environment: "node",
    // Las pruebas de integración comparten una sola base local: nunca en paralelo.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
