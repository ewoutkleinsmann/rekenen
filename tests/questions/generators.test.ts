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

  it("never produces negative answers for add/subtract categories", () => {
    const arithmetic = [
      "add_sub_30",
      "add_sub_100",
      "add_sub_from_ten",
      "add_sub_tens",
    ];
    for (const cat of arithmetic) {
      for (let seed = 0; seed < 200; seed++) {
        for (let i = 0; i < 5; i++) {
          const q = generateQuestion(1, seed, i, cat);
          expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("keeps add/subtract answers within 100 (groep 4 scope)", () => {
    const within100 = ["add_sub_30", "add_sub_100", "add_sub_tens"];
    for (const cat of within100) {
      for (let seed = 0; seed < 200; seed++) {
        for (let i = 0; i < 5; i++) {
          const q = generateQuestion(1, seed, i, cat);
          expect(q.correctAnswer).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("does not reveal the answer in the measure_visual prompt", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion(4, 7, i, "measure_visual");
      expect(q.display).toBe("measure");
      expect(q.visualData?.measureValue).toBe(q.correctAnswer);
      expect(q.prompt).not.toContain(String(q.correctAnswer));
    }
  });

  it("randomizes money_visual totals", () => {
    const totals = new Set(
      Array.from(
        { length: 12 },
        (_, i) => generateQuestion(3, 5, i, "money_visual").correctAnswer,
      ),
    );
    expect(totals.size).toBeGreaterThan(3);
  });

  it("makes duration_minutes require computing the gap", () => {
    const q = generateQuestion(6, 3, 0, "duration_minutes");
    expect(q.prompt).toMatch(/begint om .* eindigt om/);
  });

  it("generates real table_fill_gap and table_read questions", () => {
    const gap = generateQuestion(9, 11, 0, "table_fill_gap");
    expect(gap.prompt).toContain("×");
    expect(gap.prompt).toContain("?");
    const read = generateQuestion(9, 11, 0, "table_read");
    expect(read.prompt).toContain("Tafel van");
    expect(read.prompt).toContain("?");
  });
});
