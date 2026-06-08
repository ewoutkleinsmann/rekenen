import { getLevel } from "../config/loadConfig";
import { getScoringConfig } from "../config/loadConfig";
import { createPrng, pickOne } from "./prng";
import { generators } from "./generators";
import type { Question } from "./types";

export function generateQuestion(
  levelId: number,
  seed: number,
  index: number,
  categoryOverride?: string,
): Question {
  const level = getLevel(levelId);
  const rng = createPrng(seed + index);
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
): Question[] {
  const { questionsPerRound } = getScoringConfig();
  return Array.from({ length: questionsPerRound }, (_, i) =>
    generateQuestion(levelId, seed, i),
  );
}

export function validateAnswer(question: Question, input: string): boolean {
  const normalized = input.trim().replace(/\s/g, "");
  if (normalized === "") return false;
  const num = parseInt(normalized, 10);
  return !Number.isNaN(num) && num === question.correctAnswer;
}
