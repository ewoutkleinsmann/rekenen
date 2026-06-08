import { describe, it, expect } from "vitest";
import { computeEffectiveStats, getUpgradeLevel } from "../../src/garage/stats";
import type { CarInstance } from "../../src/game/types";

const baseInstance: CarInstance = {
  instanceId: "test-1",
  carId: "booster-blaze",
  upgrades: [],
};

describe("garage stats", () => {
  it("returns base car stats", () => {
    const stats = computeEffectiveStats(baseInstance);
    expect(stats.speed).toBe(75);
    expect(stats.boost).toBeGreaterThan(75);
  });

  it("applies upgrade effects", () => {
    const instance: CarInstance = {
      ...baseInstance,
      upgrades: [{ upgradeId: "slicks", level: 2 }],
    };
    const stats = computeEffectiveStats(instance);
    const base = computeEffectiveStats(baseInstance);
    expect(stats.grip).toBeGreaterThan(base.grip);
  });

  it("unlocks rocket segment with baan blaster", () => {
    const instance: CarInstance = {
      ...baseInstance,
      upgrades: [{ upgradeId: "baan-blaster-rockets", level: 1 }],
    };
    const stats = computeEffectiveStats(instance);
    expect(stats.unlocks).toContain("rocket-segment");
  });

  it("tracks upgrade level", () => {
    const instance: CarInstance = {
      ...baseInstance,
      upgrades: [{ upgradeId: "slicks", level: 1 }],
    };
    expect(getUpgradeLevel(instance, "slicks")).toBe(1);
    expect(getUpgradeLevel(instance, "power-booster-kit")).toBe(0);
  });
});
