export type QuestionDisplay = "text" | "clock" | "money" | "measure";

export interface QuestionVisualData {
  clockHour?: number;
  clockMinute?: number;
  clockStyle?: "analog" | "digital";
  coins?: number[];
  bills?: number[];
  measureValue?: number;
  measureUnit?: string;
  measureTarget?: string;
}

export interface Question {
  id: string;
  type: string;
  prompt: string;
  display: QuestionDisplay;
  correctAnswer: number;
  timeMs: number;
  visualData?: QuestionVisualData;
}

export interface GeneratorContext {
  seed: number;
  index: number;
  baseTimeMs: number;
}

export type QuestionGenerator = (ctx: GeneratorContext) => Question;
