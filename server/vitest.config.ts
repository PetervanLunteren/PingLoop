import { defineConfig } from "vitest/config";

// Self-contained so Vitest does not climb up and load the frontend vite config.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
