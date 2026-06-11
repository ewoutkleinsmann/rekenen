import { describe, it } from "vitest";
import { main } from "./run-race-matrix";

describe("race matrix tool", () => {
  it(
    "simulates all tracks × scenarios and prints matrix",
    async () => {
      await main();
    },
    300_000,
  );
});
