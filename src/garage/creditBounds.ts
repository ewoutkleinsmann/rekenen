import {
  getCar,
  getScoringConfig,
  getUpgrade,
} from "../config/loadConfig";
import type { CarInstance } from "../game/types";
import type { GameSave } from "../game/types";

/** Sum of shop spend implied by garage (for save credit sanity checks). */
export function estimateLifetimeSpent(ownedCars: CarInstance[]): number {
  const { starterCarId } = getScoringConfig();
  let spent = 0;
  const paidCarIds = new Set<string>();

  for (const inst of ownedCars) {
    if (!paidCarIds.has(inst.carId)) {
      paidCarIds.add(inst.carId);
      if (inst.carId !== starterCarId) {
        spent += getCar(inst.carId).price;
      }
    }
    for (const u of inst.upgrades) {
      const upgrade = getUpgrade(u.upgradeId);
      spent += (upgrade.price * u.level * (u.level + 1)) / 2;
    }
  }

  return spent;
}

/** Upper bound on `credits` from quiz earnings minus recorded shop spend. */
export function maxCreditsAllowed(save: GameSave): number {
  const { startingCredits, baseCorrect, maxTimeBonus } = getScoringConfig();
  const maxPerCorrect = baseCorrect + maxTimeBonus;
  const earnedCap = save.stats.totalCorrect * maxPerCorrect;
  const spent = estimateLifetimeSpent(save.ownedCars);

  const pendingInQuiz =
    save.phase === "quiz" && save.roundState
      ? save.roundState.creditsThisRound
      : 0;

  return Math.max(0, startingCredits + earnedCap - spent + pendingInQuiz);
}
