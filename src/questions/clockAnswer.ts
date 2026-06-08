const HOUR_WORDS: Record<number, string[]> = {
  1: ["een", "eén", "1"],
  2: ["twee", "2"],
  3: ["drie", "3"],
  4: ["vier", "4"],
  5: ["vijf", "5"],
  6: ["zes", "6"],
  7: ["zeven", "7"],
  8: ["acht", "8"],
  9: ["negen", "9"],
  10: ["tien", "10"],
  11: ["elf", "11"],
  12: ["twaalf", "12"],
};

function nextHour(hour: number): number {
  return hour === 12 ? 1 : hour + 1;
}

function hourPhrases(hour: number): string[] {
  return HOUR_WORDS[hour]!.map((word) => `${word} uur`);
}

export function normalizeClockAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/é/g, "e").replace(/\s+/g, " ");
}

export function getClockAnswerText(hour: number, minute: number): string {
  if (minute === 0) {
    return hourPhrases(hour)[0]!;
  }
  if (minute === 15) {
    return `kwart over ${HOUR_WORDS[hour]![0]}`;
  }
  if (minute === 30) {
    return `half ${HOUR_WORDS[nextHour(hour)]![0]}`;
  }
  if (minute === 45) {
    return `kwart voor ${HOUR_WORDS[nextHour(hour)]![0]}`;
  }
  throw new Error(`Unsupported clock minute: ${minute}`);
}

export function getAcceptedClockAnswers(
  hour: number,
  minute: number,
): string[] {
  const next = nextHour(hour);
  let phrases: string[];

  if (minute === 0) {
    phrases = hourPhrases(hour);
  } else if (minute === 15) {
    phrases = HOUR_WORDS[hour]!.map((word) => `kwart over ${word}`);
  } else if (minute === 30) {
    phrases = HOUR_WORDS[next]!.map((word) => `half ${word}`);
  } else if (minute === 45) {
    phrases = HOUR_WORDS[next]!.map((word) => `kwart voor ${word}`);
  } else {
    throw new Error(`Unsupported clock minute: ${minute}`);
  }

  return [...new Set(phrases.map(normalizeClockAnswer))];
}

export function validateClockAnswer(
  hour: number,
  minute: number,
  input: string,
): boolean {
  const normalized = normalizeClockAnswer(input);
  if (normalized === "") return false;
  return getAcceptedClockAnswers(hour, minute).includes(normalized);
}
