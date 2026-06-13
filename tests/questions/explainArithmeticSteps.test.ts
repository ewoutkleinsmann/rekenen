import { describe, it, expect } from "vitest";
import {
  explainArithmeticSteps,
  parseSimpleSumPrompt,
} from "../../src/questions/explainArithmeticSteps";
import { generateQuestion } from "../../src/questions/registry";
import { explainCorrectAnswer } from "../../src/questions/explainAnswer";

describe("explainArithmeticSteps", () => {
  it("parses plus and minus prompts", () => {
    expect(parseSimpleSumPrompt("28 + 15 = ?")).toEqual({
      op: "add",
      a: 28,
      b: 15,
    });
    expect(parseSimpleSumPrompt("52 − 27 = ?")).toEqual({
      op: "sub",
      a: 52,
      b: 27,
    });
  });

  it("shows bridge-ten steps for addition", () => {
    const text = explainArithmeticSteps("28 + 15 = ?")!;
    expect(text).toContain("28 + 2 = 30");
    expect(text).toContain("30 + 13 = 43");
  });

  it("shows tens-then-ones steps for subtraction", () => {
    const text = explainArithmeticSteps("52 − 27 = ?")!;
    expect(text).toContain("52 − 20 = 32");
    expect(text).toContain("32 − 2 = 30");
    expect(text).toContain("30 − 5 = 25");
  });

  it("explains tens_to_100 missing addend", () => {
    const text = explainArithmeticSteps("80 + ? = 100")!;
    expect(text).toContain("80 + 20 = 100");
  });

  it("uses step explanation for add_sub generator questions", () => {
    const q = generateQuestion(3, 99, 0, "add_sub_100");
    const text = explainCorrectAnswer(q);
    expect(text).toMatch(/Tel stap voor stap/);
    expect(text).toContain(String(q.correctAnswer));
  });
});
