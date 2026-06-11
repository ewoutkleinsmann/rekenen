import type { CarStats } from "../config/schemas";

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
  creditsThisRound: number;
  answers: AnswerRecord[];
  currentQuestions: string[];
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
}

export interface EffectiveCar extends CarStats {
  carId: string;
  instanceId: string;
  unlocks: string[];
  traitBonuses: Record<string, number>;
}
