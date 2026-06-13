import type { Question } from "./types";
import { formatCorrectAnswer } from "./formatAnswer";
import { getClockAnswerText } from "./clockAnswer";
import {
  explainArithmeticSteps,
  isAddSubQuestionType,
} from "./explainArithmeticSteps";

/** Short explanation shown after a wrong answer. */
export function explainCorrectAnswer(question: Question): string {
  const answerText = formatCorrectAnswer(question);

  if (
    isAddSubQuestionType(question.type) ||
    parseSimpleSumForExplain(question.prompt)
  ) {
    const arith = explainArithmeticSteps(question.prompt);
    if (arith) return arith;
  }

  if (question.display === "clock" && question.visualData) {
    const { clockHour, clockMinute } = question.visualData;
    if (clockHour != null && clockMinute != null) {
      const h = clockHour;
      const m = clockMinute;
      if (m === 0) {
        return `De wijzers staan op heel uur: ${h} uur. Antwoord in woorden, bijvoorbeeld "${answerText}".`;
      }
      if (m === 15) {
        return `Kwart over ${h}: de lange wijzer wijst naar de 3. Je zegt: "${answerText}".`;
      }
      if (m === 30) {
        return `Half ${h === 12 ? 1 : h + 1}: de lange wijzer wijst naar de 6. Je zegt: "${answerText}".`;
      }
      if (m === 45) {
        return `Kwart voor ${h === 12 ? 1 : h + 1}: bijna het volgende uur. Je zegt: "${answerText}".`;
      }
      return `Lees eerst het uur (${h}), dan de minuten (${m}). Op de klok is dat "${answerText}".`;
    }
  }

  if (question.display === "money" && question.visualData?.coins?.length) {
    const coins = question.visualData.coins;
    const sum = coins.reduce((a, b) => a + b, 0);
    return `Tel alle munten op: ${coins.join(" + ")} = ${sum} cent. Dat is ${answerText}.`;
  }

  if (question.display === "measure" && question.visualData) {
    const unit = question.visualData.measureUnit ?? "";
    const val = question.visualData.measureValue ?? question.correctAnswer;
    return `Kijk waar de vulling staat op de maatstaaf: ${val}${unit ? ` ${unit}` : ""}.`;
  }

  if (question.prompt.includes("?")) {
    const filled = question.prompt.replace("?", String(question.correctAnswer));
    if (filled !== question.prompt) {
      return `Reken het uit: ${filled}`;
    }
  }

  if (question.type.startsWith("table_")) {
    return `Zoek het juiste getal in de tafel. Het antwoord is ${answerText}.`;
  }

  if (question.type.includes("duration")) {
    return `Trek de starttijd af van de eindtijd (in minuten). Het duurt ${answerText} minuut${question.correctAnswer === 1 ? "" : "en"}.`;
  }

  return `Het goede antwoord is ${answerText}. Probeer de som nog eens rustig na te rekenen.`;
}

/** Extra hint for clock: list accepted phrasing. */
export function clockAnswerHints(question: Question): string | null {
  if (question.display !== "clock" || !question.acceptedAnswers?.length) {
    return null;
  }
  try {
    if (
      question.visualData?.clockHour != null &&
      question.visualData?.clockMinute != null
    ) {
      const primary = getClockAnswerText(
        question.visualData.clockHour,
        question.visualData.clockMinute,
      );
      return `Ook goed: typ bijvoorbeeld "${primary}" (kleine letters mag).`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function parseSimpleSumForExplain(prompt: string): boolean {
  return /^\d+\s*([+−-]|\+\s*\?)\s*/.test(prompt.trim());
}
