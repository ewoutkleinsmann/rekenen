import type { GameSave } from "./types";
import { createStarterGarage } from "../garage/shop";
import { maxCreditsAllowed } from "../garage/creditBounds";
import { getScoringConfig, getCarsConfig } from "../config/loadConfig";

export const SAVE_KEY = "hot-wheels-rekenen-save";

const POST_QUIZ_PHASES = new Set<GameSave["phase"]>([
  "shop",
  "selectCar",
  "race",
  "result",
]);

function normalizeRoundCredits(save: GameSave): GameSave {
  const rs = save.roundState;
  if (!rs) return save;

  let roundState = rs;

  if (POST_QUIZ_PHASES.has(save.phase) && rs.creditsThisRound > 0) {
    roundState = {
      ...roundState,
      roundEarned: roundState.roundEarned ?? rs.creditsThisRound,
      creditsThisRound: 0,
    };
  }

  return roundState === rs ? save : { ...save, roundState };
}

function clampInflatedCredits(save: GameSave): GameSave {
  const ceiling = maxCreditsAllowed(save);
  if (save.credits <= ceiling) return save;
  return { ...save, credits: ceiling };
}

/** Drop unknown cars from older saves; keep starter if garage would be empty. */
export function sanitizeSave(save: GameSave): GameSave {
  const validIds = new Set(getCarsConfig().cars.map((c) => c.id));
  let ownedCars = save.ownedCars.filter((c) => validIds.has(c.carId));
  if (ownedCars.length === 0) {
    ownedCars = createStarterGarage();
  }
  let selectedCarInstanceId = save.selectedCarInstanceId;
  if (
    selectedCarInstanceId &&
    !ownedCars.some((c) => c.instanceId === selectedCarInstanceId)
  ) {
    selectedCarInstanceId = ownedCars[0]?.instanceId;
  }
  let next: GameSave = { ...save, ownedCars, selectedCarInstanceId };
  if (!next.reviewQueue) next = { ...next, reviewQueue: [] };
  if (next.roundState && !next.roundState.questionSnapshots) {
    next = {
      ...next,
      roundState: { ...next.roundState, questionSnapshots: [] },
    };
  }
  next = normalizeRoundCredits(next);
  next = clampInflatedCredits(next);
  return next;
}

export function createNewSave(playerName?: string): GameSave {
  return {
    version: 1,
    playerName,
    level: 1,
    credits: getScoringConfig().startingCredits,
    ownedCars: createStarterGarage(),
    phase: "title",
    stats: { totalRaces: 0, totalCorrect: 0, racesWon: 0 },
    reviewQueue: [],
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
  return sanitizeSave(parsed);
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
