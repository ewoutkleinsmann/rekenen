import { describe, it, expect } from "vitest";
import {
  generateQuestion,
  generateRoundQuestions,
  validateAnswer,
} from "../../src/questions/registry";
import { generators } from "../../src/questions/generators";

describe("question generators", () => {
  it("has generator for every level 1 category", () => {
    const cats = [
      "add_sub_30",
      "measure_text",
      "money_cents",
      "clock_half_hour",
    ];
    for (const cat of cats) {
      expect(generators[cat]).toBeDefined();
    }
  });

  it("generates reproducible questions with same seed", () => {
    const a = generateQuestion(1, 42, 0, "add_sub_30");
    const b = generateQuestion(1, 42, 0, "add_sub_30");
    expect(a.prompt).toBe(b.prompt);
    expect(a.correctAnswer).toBe(b.correctAnswer);
  });

  it("sets timeMs from level and type", () => {
    const table = generateQuestion(3, 1, 0, "table_5");
    const story = generateQuestion(3, 1, 0, "money_story");
    expect(table.timeMs).toBeLessThan(story.timeMs);
  });

  it("generates 10 questions per round", () => {
    const round = generateRoundQuestions(1, 99);
    expect(round).toHaveLength(10);
    round.forEach((q) => {
      expect(q.timeMs).toBeGreaterThan(0);
      expect(q.prompt.length).toBeGreaterThan(0);
    });
  });

  it("varies categories within a round", () => {
    const round = generateRoundQuestions(1, 99);
    const types = new Set(round.map((q) => q.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it("validates numeric answers", () => {
    const q = generateQuestion(1, 1, 0, "add_sub_30");
    expect(validateAnswer({ ...q, correctAnswer: 25 }, "25")).toBe(true);
    expect(validateAnswer({ ...q, correctAnswer: 25 }, "26")).toBe(false);
    expect(validateAnswer({ ...q, correctAnswer: 25 }, "")).toBe(false);
  });

  it("generates visual clock questions", () => {
    const q = generateQuestion(2, 5, 0, "clock_visual");
    expect(q.display).toBe("clock");
    expect(q.visualData?.clockHour).toBeDefined();
  });

  it("uses visual clocks for half-hour and quarter categories", () => {
    const half = generateQuestion(1, 5, 0, "clock_half_hour");
    const quarter = generateQuestion(2, 5, 0, "clock_quarter");
    expect(half.display).toBe("clock");
    expect(quarter.display).toBe("clock");
    expect(half.prompt).not.toContain("HHMM");
    expect(half.acceptedAnswers?.length).toBeGreaterThan(0);
    expect([0, 30]).toContain(half.visualData?.clockMinute);
    expect([0, 15, 30, 45]).toContain(quarter.visualData?.clockMinute);
  });

  it("varies measure text prompts within a category", () => {
    const prompts = new Set(
      Array.from(
        { length: 10 },
        (_, i) => generateQuestion(1, 99, i, "measure_text").prompt,
      ),
    );
    expect(prompts.size).toBeGreaterThan(5);
  });
});
