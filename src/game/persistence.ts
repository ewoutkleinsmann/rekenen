import type { GameSave } from "./types";
import { createStarterGarage } from "../garage/shop";
import { getScoringConfig } from "../config/loadConfig";

export const SAVE_KEY = "hot-wheels-rekenen-save";

export function createNewSave(playerName?: string): GameSave {
  return {
    version: 1,
    playerName,
    level: 1,
    credits: getScoringConfig().startingCredits,
    ownedCars: createStarterGarage(),
    phase: "title",
    stats: { totalRaces: 0, totalCorrect: 0, racesWon: 0 },
  };
}

export function serializeSave(save: GameSave): string {
  return JSON.stringify(save);
}

export function deserializeSave(raw: string): GameSave {
  const parsed = JSON.parse(raw) as GameSave;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported save version: ${parsed.version}`);
  }
  return parsed;
}

export function loadSave(): GameSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserializeSave(raw);
  } catch {
    return null;
  }
}

export function saveGame(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, serializeSave(save));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
