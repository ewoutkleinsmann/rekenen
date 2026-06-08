import { getQuestionType, getScoringConfig } from "../config/loadConfig";

export function getQuestionTimeMs(
  baseTimeMs: number,
  questionTypeId: string,
): number {
  const typeConfig = getQuestionType(questionTypeId);
  const scoring = getScoringConfig();
  const raw = Math.round(baseTimeMs * typeConfig.timeFactor);
  return Math.min(scoring.maxTimeMs, Math.max(scoring.minTimeMs, raw));
}
