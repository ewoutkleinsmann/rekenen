import { getScoringConfig } from "../config/loadConfig";

export function calculatePoints(
  correct: boolean,
  timeRemainingMs: number,
  questionTimeMs: number,
): number {
  if (!correct || questionTimeMs <= 0) return 0;
  const { baseCorrect, maxTimeBonus } = getScoringConfig();
  const ratio = Math.max(0, Math.min(1, timeRemainingMs / questionTimeMs));
  return baseCorrect + Math.floor(ratio * maxTimeBonus);
}
