import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests mirror src/ under test/ and import production code via the "@/"
// alias, so the alias must be mirrored here (tsconfig paths are not read
// by vitest). Environment is "node": the suite covers pure domain/data
// logic and the UI reducer, never the DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
