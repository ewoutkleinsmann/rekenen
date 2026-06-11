import { describe, it, expect } from "vitest";
import { simulateRace3D } from "../../src/race3d/sim/simulateRace3d";
import { buildTrack3d } from "../../src/race3d/sim/buildTrack3d";
import { computeEffectiveStats } from "../../src/garage/stats";
import { getTrack } from "../../src/config/loadConfig";
import type { CarInstance } from "../../src/game/types";

const boosterBlaze: CarInstance = {
  instanceId: "bb-1",
  carId: "booster-blaze",
  upgrades: [],
};

const gripGt: CarInstance = {
  instanceId: "gg-1",
  carId: "grip-gt",
  upgrades: [],
};

describe("3D race simulation", () => {
  it("is deterministic", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const a = await simulateRace3D(stats, getTrack("track-01"));
    const b = await simulateRace3D(stats, getTrack("track-01"));
    expect(a.success).toBe(b.success);
    expect(a.frames.length).toBe(b.frames.length);
    expect(a.frames[0]?.pos).toEqual(b.frames[0]?.pos);
    const lastA = a.frames[a.frames.length - 1]!;
    const lastB = b.frames[b.frames.length - 1]!;
    expect(lastA.pos).toEqual(lastB.pos);
  });

  it("completes easy track with starter car", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = await simulateRace3D(stats, getTrack("track-01"));
    if (!result.success) {
      throw new Error(
        `track-01 failed: ${result.failureReason} at segment ${result.failureSegmentIndex}`,
      );
    }
    expect(result.success).toBe(true);
  });

  it("fails hard loop without enough grip on track 7", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = await simulateRace3D(stats, getTrack("track-07"));
    expect(result.success).toBe(false);
    expect(result.failureReason).toBeDefined();
    expect(result.frames.length).toBeGreaterThan(15);
  });

  it("passes loop with grip car and upgrades", async () => {
    const instance: CarInstance = {
      ...gripGt,
      upgrades: [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "super-charger-motor", level: 3 },
      ],
    };
    const stats = computeEffectiveStats(instance);
    const result = await simulateRace3D(stats, getTrack("track-05"));
    expect(result.success).toBe(true);
  });

  it("requires rocket upgrade for rocket segment", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = await simulateRace3D(stats, getTrack("track-08"));
    expect(result.success).toBe(false);
    expect(result.failureReason).toContain("Baan Blaster");
  });

  it("keeps every track winnable with an appropriate built car", async () => {
    // Grip-focused gauntlet (track-07): a maxed grip car must be able to win.
    const gripBuild: CarInstance = {
      instanceId: "grip-max",
      carId: "grip-gt",
      upgrades: [
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "sport-steering", level: 5 },
        { upgradeId: "super-charger-motor", level: 5 },
      ],
    };
    const gauntlet = await simulateRace3D(
      computeEffectiveStats(gripBuild),
      getTrack("track-07"),
    );
    expect(gauntlet.success).toBe(true);

    // Champion's Crown (track-09): a fully kitted rocket car must be able to win.
    const champBuild: CarInstance = {
      instanceId: "rocket-max",
      carId: "rocket-racer",
      upgrades: [
        { upgradeId: "baan-blaster-rockets", level: 1 },
        { upgradeId: "super-charger-motor", level: 5 },
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "sport-steering", level: 5 },
        { upgradeId: "lightweight-chassis", level: 3 },
        { upgradeId: "power-booster-kit", level: 4 },
      ],
    };
    const champion = await simulateRace3D(
      computeEffectiveStats(champBuild),
      getTrack("track-09"),
    );
    expect(champion.success).toBe(true);
  });

  it("does not let the bare starter clear mid/late tracks", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    for (const id of ["track-07", "track-09"]) {
      const result = await simulateRace3D(stats, getTrack(id));
      expect(result.success).toBe(false);
    }
  });

  it("exposes a par time limit derived from track length", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = await simulateRace3D(stats, getTrack("track-05"));
    expect(result.timeLimitSec).toBeGreaterThan(10);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it("keeps centerline distance aligned with 3D spacing on jump tracks", () => {
    for (const id of ["track-04", "track-06", "track-08", "track-09"]) {
      const built = buildTrack3d(getTrack(id));
      for (let i = 0; i < built.nodes.length - 1; i++) {
        const a = built.nodes[i]!;
        const b = built.nodes[i + 1]!;
        const eucl = Math.hypot(
          b.pos[0] - a.pos[0],
          b.pos[1] - a.pos[1],
          b.pos[2] - a.pos[2],
        );
        const ddist = b.dist - a.dist;
        expect(eucl).toBeCloseTo(ddist, 2);
      }
    }
  });

  it("moves the car forward from start to finish", async () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = await simulateRace3D(stats, getTrack("track-01"));
    expect(result.success).toBe(true);
    const first = result.frames[0]!;
    const last = result.frames[result.frames.length - 1]!;
    const travelled = Math.hypot(
      last.pos[0] - first.pos[0],
      last.pos[2] - first.pos[2],
    );
    expect(travelled).toBeGreaterThan(50);
  });
});
