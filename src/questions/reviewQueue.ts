import type { Question, QuestionDisplay, QuestionVisualData } from "./types";

/** Identifies the same task across rounds (ignores round-specific ids). */
export function questionContentKey(
  q: Pick<Question, "type" | "prompt" | "correctAnswer">,
): string {
  return `${q.type}\0${q.prompt}\0${q.correctAnswer}`;
}

export interface ReviewQuestion {
  key: string;
  type: string;
  prompt: string;
  display: QuestionDisplay;
  correctAnswer: number;
  timeMs: number;
  visualData?: QuestionVisualData;
  acceptedAnswers?: string[];
  /** Correct answers in a row during review; removed at 2. Reset to 0 on wrong. */
  consecutiveCorrect: number;
}

export function reviewFromQuestion(q: Question): ReviewQuestion {
  return {
    key: questionContentKey(q),
    type: q.type,
    prompt: q.prompt,
    display: q.display,
    correctAnswer: q.correctAnswer,
    timeMs: q.timeMs,
    visualData: q.visualData,
    acceptedAnswers: q.acceptedAnswers,
    consecutiveCorrect: 0,
  };
}

export function reviewToQuestion(
  item: ReviewQuestion,
  seed: number,
  index: number,
): Question {
  return {
    id: `review-${item.key}-${seed}-${index}`,
    type: item.type,
    prompt: item.prompt,
    display: item.display,
    correctAnswer: item.correctAnswer,
    timeMs: item.timeMs,
    visualData: item.visualData,
    acceptedAnswers: item.acceptedAnswers,
  };
}

export function applyReviewQueueAnswer(
  queue: ReviewQuestion[],
  question: Question,
  correct: boolean,
): ReviewQuestion[] {
  const key = questionContentKey(question);
  const idx = queue.findIndex((r) => r.key === key);

  if (!correct) {
    const entry = reviewFromQuestion(question);
    if (idx >= 0) {
      const next = [...queue];
      next[idx] = { ...entry, consecutiveCorrect: 0 };
      return next;
    }
    return [...queue, entry];
  }

  if (idx < 0) return queue;

  const streak = queue[idx]!.consecutiveCorrect + 1;
  if (streak >= 2) {
    return queue.filter((_, i) => i !== idx);
  }
  const next = [...queue];
  next[idx] = { ...next[idx]!, consecutiveCorrect: streak };
  return next;
}

/** Fraction of round slots reserved for review picks (when queue non-empty). */
export const REVIEW_SLOT_FRACTION = 0.35;

export function maxReviewSlotsPerRound(
  questionsPerRound: number,
  queueLength: number,
): number {
  if (queueLength === 0) return 0;
  return Math.min(
    queueLength,
    Math.max(1, Math.floor(questionsPerRound * REVIEW_SLOT_FRACTION)),
  );
}
