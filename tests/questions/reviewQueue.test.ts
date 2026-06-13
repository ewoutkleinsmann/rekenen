import { describe, it, expect } from "vitest";
import { generateRoundQuestions, questionContentKey } from "../../src/questions/registry";
import {
  applyReviewQueueAnswer,
  reviewFromQuestion,
} from "../../src/questions/reviewQueue";
import { generateQuestion } from "../../src/questions/registry";

describe("round question uniqueness", () => {
  it("has no duplicate content in a round", () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = generateRoundQuestions(7, 1000 + seed, []);
      const keys = round.map((q) => questionContentKey(q));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("review queue", () => {
  const q = generateQuestion(3, 42, 0, "table_5");

  it("adds wrong answers to the queue", () => {
    const next = applyReviewQueueAnswer([], q, false);
    expect(next).toHaveLength(1);
    expect(next[0]!.consecutiveCorrect).toBe(0);
    expect(next[0]!.prompt).toBe(q.prompt);
  });

  it("removes after two consecutive correct answers", () => {
    const item = reviewFromQuestion(q);
    let queue = [{ ...item, consecutiveCorrect: 0 }];
    queue = applyReviewQueueAnswer(queue, q, true);
    expect(queue[0]!.consecutiveCorrect).toBe(1);
    queue = applyReviewQueueAnswer(queue, q, true);
    expect(queue).toHaveLength(0);
  });

  it("resets streak on wrong again", () => {
    const item = reviewFromQuestion(q);
    let queue = [{ ...item, consecutiveCorrect: 1 }];
    queue = applyReviewQueueAnswer(queue, q, false);
    expect(queue[0]!.consecutiveCorrect).toBe(0);
  });

  it("prefers review items in later rounds when present", () => {
    const item = reviewFromQuestion(q);
    const round = generateRoundQuestions(3, 999, [{ ...item, consecutiveCorrect: 0 }]);
    const keys = round.map((r) => questionContentKey(r));
    expect(keys).toContain(item.key);
  });
});
