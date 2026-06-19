import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the lib layer (pure logic + D1-backed helpers via fakes).
// Stood up in Step 1 of the Backend Master Plan; CI runs `npm test` on every PR.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
