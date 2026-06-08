import { describe, it, expect } from "vitest";
import { simulateRace } from "../../src/race/simulation";
import { computeEffectiveStats } from "../../src/garage/stats";
import { getTrack } from "../../src/config/loadConfig";
import type { CarInstance } from "../../src/game/types";
import type { TrackSegment } from "../../src/config/schemas";

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

const simpleTrack: TrackSegment[] = [
  { type: "straight", length: 80 },
  { type: "booster", boostMultiplier: 1.3 },
];

describe("race simulation", () => {
  it("is deterministic", () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const a = simulateRace(stats, simpleTrack);
    const b = simulateRace(stats, simpleTrack);
    expect(a.success).toBe(b.success);
    expect(a.keyframes.length).toBe(b.keyframes.length);
    expect(a.keyframes[0]?.x).toBe(b.keyframes[0]?.x);
  });

  it("completes easy track with starter car", () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = simulateRace(stats, getTrack("track-01").segments);
    if (!result.success) {
      throw new Error(
        `track-01 failed: ${result.failureReason} at segment ${result.failureSegmentIndex} ticks ${result.totalTicks}`,
      );
    }
    expect(result.success).toBe(true);
  });

  it("fails hard loop without enough grip on track 7", () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = simulateRace(stats, getTrack("track-07").segments);
    expect(result.success).toBe(false);
  });

  it("passes loop with grip car and upgrades", () => {
    const instance: CarInstance = {
      ...gripGt,
      upgrades: [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "super-charger-motor", level: 2 },
      ],
    };
    const stats = computeEffectiveStats(instance);
    const result = simulateRace(stats, getTrack("track-05").segments);
    expect(result.success).toBe(true);
  });

  it("requires rocket upgrade for rocket segment", () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = simulateRace(stats, getTrack("track-08").segments);
    expect(result.success).toBe(false);
    expect(result.failureReason).toContain("Baan Blaster");
  });

  it("keyframes move from start to finish with sensible angles", () => {
    const stats = computeEffectiveStats(boosterBlaze);
    const result = simulateRace(stats, getTrack("track-01").segments);
    expect(result.success).toBe(true);
    const first = result.keyframes[0]!;
    const last = result.keyframes[result.keyframes.length - 1]!;
    expect(first.x).toBeLessThan(last.x);
    expect(Math.abs(first.angle)).toBeLessThan(Math.PI / 2);
    expect(last.x).toBeGreaterThan(first.x + 500);
  });
});
