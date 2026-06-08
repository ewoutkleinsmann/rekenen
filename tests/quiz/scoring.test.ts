import { describe, it, expect } from "vitest";
import { calculatePoints } from "../../src/quiz/scoring";

describe("calculatePoints", () => {
  it("returns 0 for wrong answer", () => {
    expect(calculatePoints(false, 5000, 10000)).toBe(0);
  });

  it("returns base + bonus for fast correct answer", () => {
    const points = calculatePoints(true, 10000, 10000);
    expect(points).toBe(100);
  });

  it("returns base only for last-second answer", () => {
    const points = calculatePoints(true, 0, 10000);
    expect(points).toBe(50);
  });
});
