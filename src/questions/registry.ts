import { getLevel } from "../config/loadConfig";
import { getScoringConfig } from "../config/loadConfig";
import { createPrng, pickOne, shuffleInPlace } from "./prng";
import { generators } from "./generators";
import type { Question } from "./types";
import { validateClockAnswer } from "./clockAnswer";
import type { ReviewQuestion } from "./reviewQueue";
import {
  maxReviewSlotsPerRound,
  questionContentKey,
  reviewToQuestion,
} from "./reviewQueue";

export function generateQuestion(
  levelId: number,
  seed: number,
  index: number,
  categoryOverride?: string,
): Question {
  const level = getLevel(levelId);
  const rng = createPrng(seed + index * 117);
  const category = categoryOverride ?? pickOne(rng, level.questionCategories);
  const generator = generators[category];
  if (!generator) {
    throw new Error(`No generator for category: ${category}`);
  }
  return generator({ seed, index, baseTimeMs: level.baseTimeMs });
}

export function generateRoundQuestions(
  levelId: number,
  seed: number,
  reviewQueue: ReviewQuestion[] = [],
): Question[] {
  const { questionsPerRound } = getScoringConfig();
  const level = getLevel(levelId);
  const rng = createPrng(seed);
  const usedKeys = new Set<string>();
  const questions: Question[] = [];
  let genIndex = 0;

  const reviewCap = maxReviewSlotsPerRound(
    questionsPerRound,
    reviewQueue.length,
  );
  const reviewPool = [...reviewQueue];
  shuffleInPlace(rng, reviewPool);

  for (const item of reviewPool) {
    if (questions.length >= reviewCap) break;
    if (usedKeys.has(item.key)) continue;
    usedKeys.add(item.key);
    questions.push(reviewToQuestion(item, seed, genIndex++));
  }

  const maxAttempts = questionsPerRound * 100;
  let attempts = 0;
  while (questions.length < questionsPerRound && attempts < maxAttempts) {
    attempts++;
    const category = pickOne(rng, level.questionCategories);
    const q = generateQuestion(levelId, seed, genIndex++, category);
    const key = questionContentKey(q);
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    questions.push(q);
  }

  if (questions.length < questionsPerRound) {
    throw new Error(
      `Could only generate ${questions.length}/${questionsPerRound} unique questions for level ${levelId}`,
    );
  }

  shuffleInPlace(rng, questions);
  return questions;
}

export function validateAnswer(question: Question, input: string): boolean {
  if (question.display === "clock" && question.visualData) {
    const { clockHour, clockMinute } = question.visualData;
    if (clockHour == null || clockMinute == null) return false;
    return validateClockAnswer(clockHour, clockMinute, input);
  }

  const normalized = input.trim().replace(/\s/g, "");
  if (normalized === "") return false;
  const num = parseInt(normalized, 10);
  return !Number.isNaN(num) && num === question.correctAnswer;
}

export { questionContentKey } from "./reviewQueue";
