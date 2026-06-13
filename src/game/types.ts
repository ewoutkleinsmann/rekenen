import type { CarStats } from "../config/schemas";
import type { Question } from "../questions/types";
import type { ReviewQuestion } from "../questions/reviewQueue";

export type GamePhase =
  | "title"
  | "intro"
  | "quiz"
  | "shop"
  | "selectCar"
  | "race"
  | "result";

export interface CarUpgrade {
  upgradeId: string;
  level: number;
}

export interface CarInstance {
  instanceId: string;
  carId: string;
  upgrades: CarUpgrade[];
}

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  points: number;
  timeMs: number;
  timeRemainingMs: number;
}

export interface RoundState {
  questionIndex: number;
  seed: number;
  /** Running total during quiz; cleared after credits are banked. */
  creditsThisRound: number;
  /** Points banked this round (shop display) after quiz completes. */
  roundEarned?: number;
  answers: AnswerRecord[];
  /** Full quiz set for this round (persisted so reload mid-quiz stays consistent). */
  questionSnapshots: Question[];
}

export interface RaceResult {
  success: boolean;
  failureReason?: string;
  carInstanceId: string;
}

export interface GameStats {
  totalRaces: number;
  totalCorrect: number;
  racesWon: number;
}

export interface GameSave {
  version: 1;
  playerName?: string;
  level: number;
  credits: number;
  ownedCars: CarInstance[];
  phase: GamePhase;
  roundState?: RoundState;
  selectedCarInstanceId?: string;
  lastRaceResult?: RaceResult;
  stats: GameStats;
  /** Questions to revisit after mistakes (higher weight in later rounds). */
  reviewQueue?: ReviewQuestion[];
}

export interface EffectiveCar extends CarStats {
  carId: string;
  instanceId: string;
  unlocks: string[];
  traitBonuses: Record<string, number>;
}
