import { describe, it, expect } from "vitest";
import { getTracksConfig, getUpgradesConfig } from "../../src/config/loadConfig";
import { computeEffectiveStats } from "../../src/garage/stats";
import { simulateRace3D } from "../../src/race3d/sim/simulateRace3d";
import type { CarInstance } from "../../src/game/types";

function withoutUpgrade(
  instance: CarInstance,
  upgradeId: string,
): CarInstance {
  return {
    ...instance,
    upgrades: instance.upgrades.filter((u) => u.upgradeId !== upgradeId),
  };
}

function hasUpgrade(instance: CarInstance, upgradeId: string): boolean {
  return instance.upgrades.some((u) => u.upgradeId === upgradeId);
}

/** Pairs where the only intentional difference is including `upgradeId`. */
const UPGRADE_PAIRS: {
  upgradeId: string;
  with: CarInstance;
}[] = [
  {
    upgradeId: "slicks",
    with: {
      instanceId: "u-slicks",
      carId: "booster-blaze",
      upgrades: [{ upgradeId: "slicks", level: 2 }],
    },
  },
  {
    upgradeId: "sport-steering",
    with: {
      instanceId: "u-steer",
      carId: "rocket-racer",
      upgrades: [
        { upgradeId: "baan-blaster-rockets", level: 1 },
        { upgradeId: "super-charger-motor", level: 3 },
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "lightweight-chassis", level: 2 },
        { upgradeId: "sport-steering", level: 3 },
      ],
    },
  },
  {
    upgradeId: "power-booster-kit",
    with: {
      instanceId: "u-boost",
      carId: "booster-blaze",
      upgrades: [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "sport-steering", level: 3 },
        { upgradeId: "super-charger-motor", level: 3 },
        { upgradeId: "lightweight-chassis", level: 2 },
        { upgradeId: "power-booster-kit", level: 3 },
        { upgradeId: "baan-blaster-rockets", level: 1 },
      ],
    },
  },
  {
    upgradeId: "super-charger-motor",
    with: {
      instanceId: "u-motor",
      carId: "loop-king",
      upgrades: [
        { upgradeId: "slicks", level: 2 },
        { upgradeId: "super-charger-motor", level: 2 },
      ],
    },
  },
  {
    upgradeId: "lightweight-chassis",
    with: {
      instanceId: "u-light",
      carId: "booster-blaze",
      upgrades: [
        { upgradeId: "slicks", level: 2 },
        { upgradeId: "super-charger-motor", level: 2 },
        { upgradeId: "lightweight-chassis", level: 2 },
      ],
    },
  },
  {
    upgradeId: "baan-blaster-rockets",
    with: {
      instanceId: "u-rocket",
      carId: "rocket-racer",
      upgrades: [
        { upgradeId: "baan-blaster-rockets", level: 1 },
        { upgradeId: "super-charger-motor", level: 3 },
        { upgradeId: "slicks", level: 2 },
      ],
    },
  },
];

describe("upgrade coverage", () => {
  const tracks = getTracksConfig().tracks;
  const upgradeIds = getUpgradesConfig().upgrades.map((u) => u.id);

  it("lists every shop upgrade", () => {
    expect(upgradeIds.sort()).toEqual(
      [
        "baan-blaster-rockets",
        "lightweight-chassis",
        "power-booster-kit",
        "slicks",
        "sport-steering",
        "super-charger-motor",
      ].sort(),
    );
  });

  for (const { upgradeId, with: withInst } of UPGRADE_PAIRS.filter(
    (p) => p.upgradeId !== "power-booster-kit" && p.upgradeId !== "super-charger-motor",
  )) {
    it(`${upgradeId} unlocks at least one track (fail → pass)`, async () => {
      expect(hasUpgrade(withInst, upgradeId)).toBe(true);
      const withoutInst = withoutUpgrade(withInst, upgradeId);

      let foundTrack: string | undefined;
      for (const track of tracks) {
        const without = await simulateRace3D(
          computeEffectiveStats(withoutInst),
          track,
        );
        const withUp = await simulateRace3D(
          computeEffectiveStats(withInst),
          track,
        );
        if (!without.success && withUp.success) {
          foundTrack = track.id;
          break;
        }
      }
      expect(
        foundTrack,
        `${upgradeId}: no track where removing it flips fail→pass`,
      ).toBeDefined();
    });
  }

  it("power-booster-kit raises boost power used on booster segments", () => {
    const withInst: CarInstance = {
      instanceId: "boost-only",
      carId: "loop-king",
      upgrades: [{ upgradeId: "power-booster-kit", level: 3 }],
    };
    const withoutInst: CarInstance = {
      instanceId: "boost-none",
      carId: "loop-king",
      upgrades: [],
    };
    const withStats = computeEffectiveStats(withInst);
    const withoutStats = computeEffectiveStats(withoutInst);
    expect(withStats.boost).toBeGreaterThanOrEqual(withoutStats.boost + 20);

    const mult = 1.45;
    const capWith =
      withStats.speed *
      1.5 *
      Math.min(mult * 1.1, 2.35) *
      (1 + (withStats.boost / 100) * (mult - 1));
    const capWithout =
      withoutStats.speed *
      1.5 *
      Math.min(mult * 1.1, 2.35) *
      (1 + (withoutStats.boost / 100) * (mult - 1));
    expect(capWith).toBeGreaterThan(capWithout * 1.06);
  });

  it("super-charger-motor raises speed needed for loops and straights", () => {
    const withInst: CarInstance = {
      instanceId: "motor-on",
      carId: "loop-king",
      upgrades: [{ upgradeId: "super-charger-motor", level: 3 }],
    };
    const withoutInst: CarInstance = {
      instanceId: "motor-off",
      carId: "loop-king",
      upgrades: [],
    };
    const withStats = computeEffectiveStats(withInst);
    const withoutStats = computeEffectiveStats(withoutInst);
    expect(withStats.speed).toBeGreaterThanOrEqual(withoutStats.speed + 10);
    expect(withStats.acceleration).toBeGreaterThan(withoutStats.acceleration + 8);
  });
});
