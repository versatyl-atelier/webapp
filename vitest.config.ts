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
      SESSION_SECRET: "test-session-secret-do-not-use-in-production",
      SESSION_COOKIE_EMPLOYEE: "versatyl-session-employe",
      SESSION_COOKIE_MANAGER: "versatyl-session-gestionnaire",
      VERSATYL_PASSWORD_EMPLOYEE: "test-employee-password",
      VERSATYL_PASSWORD_MANAGER: "test-manager-password",
    },
  },
});
