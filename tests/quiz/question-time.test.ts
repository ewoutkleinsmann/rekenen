import { describe, it, expect } from "vitest";
import { getQuestionTimeMs } from "../../src/quiz/time";

describe("getQuestionTimeMs", () => {
  it("applies timeFactor to base time", () => {
    expect(getQuestionTimeMs(13000, "table_5")).toBe(14300);
    expect(getQuestionTimeMs(13000, "money_story")).toBe(35100);
  });

  it("clamps to min and max", () => {
    expect(getQuestionTimeMs(7000, "table_1")).toBeGreaterThanOrEqual(4000);
    expect(getQuestionTimeMs(15000, "measure_story")).toBeLessThanOrEqual(
      60000,
    );
  });

  it("gives table questions less time than story questions", () => {
    const base = 13000;
    const tableTime = getQuestionTimeMs(base, "table_5");
    const storyTime = getQuestionTimeMs(base, "money_story");
    expect(tableTime).toBeLessThan(storyTime);
  });
});
