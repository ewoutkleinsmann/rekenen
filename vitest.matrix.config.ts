import { defineConfig } from "vitest/config";

/** Run balance matrix CLI (scripts/run-race-matrix.ts). */
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["scripts/run-race-matrix.test.ts"],
    disableConsoleIntercept: true,
  },
});
