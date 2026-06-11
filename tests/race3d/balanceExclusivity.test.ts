import { describe, it, expect } from "vitest";
import { getCarsConfig, getTracksConfig } from "../../src/config/loadConfig";
import { computeEffectiveStats } from "../../src/garage/stats";
import { simulateRace3D } from "../../src/race3d/sim/simulateRace3d";
import { getTrack } from "../../src/config/loadConfig";
import type { CarInstance } from "../../src/game/types";
import { getPurchasableCars } from "../../src/garage/shop";

function maxBuild(carId: string): CarInstance {
  return {
    instanceId: "max",
    carId,
    upgrades: [
      { upgradeId: "slicks", level: 5 },
      { upgradeId: "sport-steering", level: 5 },
      { upgradeId: "super-charger-motor", level: 5 },
      { upgradeId: "lightweight-chassis", level: 3 },
      { upgradeId: "power-booster-kit", level: 4 },
      { upgradeId: "baan-blaster-rockets", level: 1 },
    ],
  };
}

describe("balance exclusivity", () => {
  it("maxed Grip GT does not clear every track (no universal supercar)", async () => {
    const stats = computeEffectiveStats(maxBuild("grip-gt"));
    const trackIds = getTracksConfig().tracks.map((t) => t.id);
    let passes = 0;
    const passed: string[] = [];
    for (const id of trackIds) {
      const r = await simulateRace3D(stats, getTrack(id));
      if (r.success) {
        passes++;
        passed.push(id);
      }
    }
    expect(passes).toBeLessThan(trackIds.length);
    expect(passes).toBeLessThanOrEqual(11);
  });

  it("each specialist car clears at least one track that max Grip GT fails", async () => {
    const gripMax = computeEffectiveStats(maxBuild("grip-gt"));
    const gripFails = new Set<string>();
    for (const t of getTracksConfig().tracks) {
      const r = await simulateRace3D(gripMax, t);
      if (!r.success) gripFails.add(t.id);
    }

    for (const car of getCarsConfig().cars) {
      if (car.id === "grip-gt" || car.id === "booster-blaze") continue;
      const stats = computeEffectiveStats(maxBuild(car.id));
      let winsOnGripFail = 0;
      for (const id of gripFails) {
        const r = await simulateRace3D(stats, getTrack(id));
        if (r.success) winsOnGripFail++;
      }
      expect(
        winsOnGripFail,
        `${car.id} should win some tracks where grip-gt max fails`,
      ).toBeGreaterThan(0);
    }
  });

  it("at level 6 only Jump Jet and Loop King can appear in shop (not all cars)", () => {
    const owned = [{ instanceId: "1", carId: "booster-blaze", upgrades: [] }];
    const at6 = getPurchasableCars(owned, 6).map((c) => c.id).sort();
    expect(at6).toEqual(["jump-jet", "loop-king"]);
  });

  it("every track names a recommended car that exists", () => {
    const carIds = new Set(getCarsConfig().cars.map((c) => c.id));
    for (const t of getTracksConfig().tracks) {
      expect(t.recommendedCarId, t.id).toBeDefined();
      expect(carIds.has(t.recommendedCarId!)).toBe(true);
    }
  });
});
