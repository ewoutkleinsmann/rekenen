import type { GamePhase } from "./types";

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  title: ["intro", "quiz"],
  intro: ["quiz"],
  quiz: ["shop"],
  shop: ["selectCar"],
  selectCar: ["race"],
  race: ["result"],
  result: ["intro", "quiz", "title"],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextPhaseAfterQuiz(): GamePhase {
  return "shop";
}

export function nextPhaseAfterShop(): GamePhase {
  return "selectCar";
}

export function nextPhaseAfterCarSelect(): GamePhase {
  return "race";
}

export function nextPhaseAfterRace(): GamePhase {
  return "result";
}

export function nextPhaseAfterResult(_raceWon: boolean): GamePhase {
  return "quiz";
}
