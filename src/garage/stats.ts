import { getCar, getCarsConfig, getUpgrade } from "../config/loadConfig";
import type { CarInstance } from "../game/types";
import type { CarStats } from "../config/schemas";

export interface EffectiveStats extends CarStats {
  carId: string;
  unlocks: string[];
  /** Extra landing weight budget on jump segments (jump-specialist cars). */
  jumpLandingBonus: number;
}

export function computeEffectiveStats(instance: CarInstance): EffectiveStats {
  const carConfig = getCar(instance.carId);
  const { statMin, statMax } = getCarsConfig();
  const stats: CarStats = { ...carConfig.stats };
  const unlocks: string[] = [];
  let jumpLandingBonus = 0;

  for (const installed of instance.upgrades) {
    const upgrade = getUpgrade(installed.upgradeId);
    const effects = upgrade.effectsPerLevel;
    for (const [key, value] of Object.entries(effects)) {
      if (key in stats && typeof value === "number") {
        const k = key as keyof CarStats;
        stats[k] = (stats[k] ?? 0) + value * installed.level;
      }
    }
    if (upgrade.unlocks) {
      for (const u of upgrade.unlocks) {
        if (!unlocks.includes(u)) unlocks.push(u);
      }
    }
  }

  if (carConfig.trait) {
    if (carConfig.trait.boosterBonus) {
      stats.boost = Math.round(
        stats.boost * (1 + carConfig.trait.boosterBonus),
      );
    }
    if (carConfig.trait.loopGripBonus) {
      stats.grip += carConfig.trait.loopGripBonus;
    }
    if (carConfig.trait.loopSpeedBonus) {
      stats.speed += carConfig.trait.loopSpeedBonus;
    }
    if (carConfig.trait.jumpBonus) {
      stats.acceleration = Math.round(
        stats.acceleration * (1 + carConfig.trait.jumpBonus),
      );
      jumpLandingBonus = Math.round(stats.weight * carConfig.trait.jumpBonus);
    }
  }

  for (const key of Object.keys(stats) as (keyof CarStats)[]) {
    stats[key] = Math.min(statMax, Math.max(statMin, stats[key]));
  }

  return { ...stats, carId: instance.carId, unlocks, jumpLandingBonus };
}

export function getUpgradeLevel(
  instance: CarInstance,
  upgradeId: string,
): number {
  return instance.upgrades.find((u) => u.upgradeId === upgradeId)?.level ?? 0;
}

export function canBuyUpgrade(
  instance: CarInstance,
  upgradeId: string,
  credits: number,
): { ok: boolean; reason?: string } {
  const upgrade = getUpgrade(upgradeId);
  const currentLevel = getUpgradeLevel(instance, upgradeId);
  if (currentLevel >= upgrade.maxLevel) {
    return { ok: false, reason: "Max level bereikt" };
  }
  const price = upgrade.price * (currentLevel + 1);
  if (credits < price) {
    return { ok: false, reason: "Niet genoeg Wheel Credits" };
  }
  return { ok: true };
}

export function getUpgradePrice(
  instance: CarInstance,
  upgradeId: string,
): number {
  const upgrade = getUpgrade(upgradeId);
  const currentLevel = getUpgradeLevel(instance, upgradeId);
  return upgrade.price * (currentLevel + 1);
}
