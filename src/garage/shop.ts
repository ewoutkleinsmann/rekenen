import {
  getCar,
  getCarsConfig,
  getScoringConfig,
  getUpgrade,
  getUpgradesConfig,
} from "../config/loadConfig";
import type { CarInstance } from "../game/types";
import { getUpgradeLevel } from "./stats";

export function createCarInstance(carId: string): CarInstance {
  return {
    instanceId: `${carId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    carId,
    upgrades: [],
  };
}

export function createStarterGarage(): CarInstance[] {
  const { starterCarId } = getScoringConfig();
  const starterId = starterCarId || getCarsConfig().cars[0]?.id;
  if (!starterId) return [];
  return [createCarInstance(starterId)];
}

export function canBuyCar(
  carId: string,
  ownedCars: CarInstance[],
  credits: number,
  playerLevel: number,
): boolean {
  const car = getCar(carId);
  if (ownedCars.some((c) => c.carId === carId)) return false;
  const minLevel = car.minUnlockLevel ?? 1;
  if (playerLevel < minLevel) return false;
  return credits >= car.price;
}

export function buyCar(
  carId: string,
  ownedCars: CarInstance[],
  credits: number,
  playerLevel: number,
): {
  cars: CarInstance[];
  credits: number;
} | null {
  if (!canBuyCar(carId, ownedCars, credits, playerLevel)) return null;
  const car = getCar(carId);
  return {
    cars: [...ownedCars, createCarInstance(carId)],
    credits: credits - car.price,
  };
}

export function applyUpgrade(
  instance: CarInstance,
  upgradeId: string,
  credits: number,
): { instance: CarInstance; credits: number } | null {
  const upgrade = getUpgrade(upgradeId);
  const currentLevel = getUpgradeLevel(instance, upgradeId);
  if (currentLevel >= upgrade.maxLevel) return null;
  const price = upgrade.price * (currentLevel + 1);
  if (credits < price) return null;

  const existing = instance.upgrades.find((u) => u.upgradeId === upgradeId);
  const upgrades = existing
    ? instance.upgrades.map((u) =>
        u.upgradeId === upgradeId ? { ...u, level: u.level + 1 } : u,
      )
    : [...instance.upgrades, { upgradeId, level: 1 }];

  return {
    instance: { ...instance, upgrades },
    credits: credits - price,
  };
}

export function getAvailableUpgrades() {
  return getUpgradesConfig().upgrades;
}

export function getPurchasableCars(
  ownedCars: CarInstance[],
  playerLevel: number,
) {
  const ownedIds = new Set(ownedCars.map((c) => c.carId));
  return getCarsConfig().cars.filter((c) => {
    if (ownedIds.has(c.id)) return false;
    const minLevel = c.minUnlockLevel ?? 1;
    return playerLevel >= minLevel;
  });
}
