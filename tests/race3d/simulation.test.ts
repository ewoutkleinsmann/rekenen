import { describe, it, expect } from "vitest";
import { simulateRace3D } from "../../src/race3d/sim/simulateRace3d";
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
  });

  it("passes loop with grip car and upgrades", async () => {
    const instance: CarInstance = {
      ...gripGt,
      upgrades: [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "super-charger-motor", level: 2 },
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
