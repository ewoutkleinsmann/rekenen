import { describe, it, expect } from "vitest";
import { generateQuestion } from "../../src/questions/registry";
import {
  explainCorrectAnswer,
  clockAnswerHints,
} from "../../src/questions/explainAnswer";
import { formatCorrectAnswer } from "../../src/questions/formatAnswer";

describe("explainCorrectAnswer", () => {
  it("fills arithmetic prompts", () => {
    const q = generateQuestion(1, 1, 0, "add_sub_30");
    const text = explainCorrectAnswer(q);
    expect(text).toContain(String(q.correctAnswer));
  });

  it("explains clock questions", () => {
    const q = generateQuestion(1, 5, 0, "clock_half_hour");
    expect(explainCorrectAnswer(q).length).toBeGreaterThan(10);
    expect(formatCorrectAnswer(q)).toMatch(/uur|half|kwart/i);
    expect(clockAnswerHints(q)).toBeTruthy();
  });
});
