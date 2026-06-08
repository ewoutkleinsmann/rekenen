import { describe, it, expect } from "vitest";
import {
  getClockAnswerText,
  getAcceptedClockAnswers,
  validateClockAnswer,
} from "../../src/questions/clockAnswer";
import { generateQuestion, validateAnswer } from "../../src/questions/registry";

describe("clockAnswer", () => {
  it("formats whole hours", () => {
    expect(getClockAnswerText(3, 0)).toBe("drie uur");
    expect(getClockAnswerText(12, 0)).toBe("twaalf uur");
  });

  it("formats half hours", () => {
    expect(getClockAnswerText(4, 30)).toBe("half vijf");
    expect(getClockAnswerText(11, 30)).toBe("half twaalf");
  });

  it("formats quarter hours", () => {
    expect(getClockAnswerText(8, 15)).toBe("kwart over acht");
    expect(getClockAnswerText(8, 45)).toBe("kwart voor negen");
  });

  it("accepts word and digit variants", () => {
    expect(validateClockAnswer(3, 0, "drie uur")).toBe(true);
    expect(validateClockAnswer(3, 0, "3 uur")).toBe(true);
    expect(validateClockAnswer(4, 30, "half vijf")).toBe(true);
    expect(validateClockAnswer(4, 30, "half 5")).toBe(true);
    expect(validateClockAnswer(8, 45, "kwart voor negen")).toBe(true);
    expect(validateClockAnswer(8, 45, "kwart voor 9")).toBe(true);
    expect(validateClockAnswer(8, 45, "930")).toBe(false);
  });

  it("validates generated clock questions with text answers", () => {
    const q = generateQuestion(1, 5, 0, "clock_half_hour");
    const hour = q.visualData!.clockHour!;
    const minute = q.visualData!.clockMinute!;
    const answer = getClockAnswerText(hour, minute);
    expect(validateAnswer(q, answer)).toBe(true);
    expect(getAcceptedClockAnswers(hour, minute)).toContain(answer);
  });
});
