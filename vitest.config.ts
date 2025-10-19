import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/__tests__/"],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}", "!src/__tests__/e2e/**/*"],
    exclude: ["node_modules", "dist", "src/__tests__/e2e"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
