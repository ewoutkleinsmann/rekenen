import type { Question } from "./types";
import { getClockAnswerText } from "./clockAnswer";

/** Human-readable correct answer for quiz feedback. */
export function formatCorrectAnswer(question: Question): string {
  if (
    question.display === "clock" &&
    question.visualData?.clockHour != null &&
    question.visualData?.clockMinute != null
  ) {
    try {
      return getClockAnswerText(
        question.visualData.clockHour,
        question.visualData.clockMinute,
      );
    } catch {
      /* fall through */
    }
  }
  if (question.display === "money" && question.correctAnswer >= 100) {
    const euros = Math.floor(question.correctAnswer / 100);
    const cents = question.correctAnswer % 100;
    if (cents === 0) return `${euros} euro`;
    return `${euros},${String(cents).padStart(2, "0")} euro`;
  }
  return String(question.correctAnswer);
}
