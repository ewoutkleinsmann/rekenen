import { describe, expect, it } from "vitest";
import {
  buildMatrixScenarios,
  runRaceMatrix,
} from "../../src/race3d/sim/raceMatrix";

describe("raceMatrix", () => {
  it("builds unique default scenarios for every car", () => {
    const scenarios = buildMatrixScenarios("default");
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(scenarios.some((s) => s.id.endsWith("__stock"))).toBe(true);
    expect(scenarios.some((s) => s.id.startsWith("fixture__"))).toBe(true);
  });

  it("full mode adds more single-upgrade sweeps", () => {
    const d = buildMatrixScenarios("default").length;
    const f = buildMatrixScenarios("full").length;
    expect(f).toBeGreaterThan(d);
  });

  it("runs a small matrix slice", async () => {
    const result = await runRaceMatrix({
      trackIds: ["track-01"],
      scenarioFilter: (s) => s.id === "fixture__starter",
    });
    expect(result.cells.size).toBe(1);
  });
});
