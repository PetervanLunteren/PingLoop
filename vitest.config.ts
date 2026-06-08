import { defineConfig } from "vitest/config";

// Frontend tests only. The server has its own config under server/.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
