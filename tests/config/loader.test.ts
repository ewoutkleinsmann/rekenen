import { describe, it, expect } from "vitest";
import {
  getLevel,
  getTrack,
  getCar,
  getQuestionType,
  getScoringConfig,
} from "../../src/config/loadConfig";

describe("config loader", () => {
  it("loads all 9 levels", () => {
    expect(getLevel(1).baseTimeMs).toBe(15000);
    expect(getLevel(9).baseTimeMs).toBe(7000);
  });

  it("loads tracks per level", () => {
    expect(getTrack(getLevel(1).trackId).segments.length).toBeGreaterThan(0);
  });

  it("loads starter car", () => {
    const car = getCar(getScoringConfig().starterCarId);
    expect(car.price).toBe(0);
  });

  it("loads question types with timeFactor", () => {
    expect(getQuestionType("table_5").timeFactor).toBe(0.55);
    expect(getQuestionType("money_story").timeFactor).toBe(1.35);
  });
});
