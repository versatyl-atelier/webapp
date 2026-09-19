import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    env: {
      LOG_LEVEL: "off",
      BETTER_AUTH_SECRET: "test-auth-secret-do-not-use-in-production",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
