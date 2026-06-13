import { getCarsConfig, getUpgradesConfig } from "../config/loadConfig";
import type { CarConfig } from "../config/schemas";
import { getPurchasableCars } from "./shop";
import type { CarInstance } from "../game/types";
import { getUpgradeLevel } from "./stats";

export interface LevelShopHighlights {
  /** Cars whose minUnlockLevel equals this level (first time in shop). */
  newCarsThisLevel: CarConfig[];
  /** Any car not yet owned that can appear in shop at this level. */
  purchasableCars: CarConfig[];
  /** At least one owned car has an upgrade below max level. */
  upgradesAvailable: boolean;
  /** Owned cars that still have upgrade levels to buy. */
  upgradeSlotsRemaining: number;
}

export function getLevelShopHighlights(
  level: number,
  ownedCars: CarInstance[],
): LevelShopHighlights {
  const { cars } = getCarsConfig();
  const ownedIds = new Set(ownedCars.map((c) => c.carId));

  const newCarsThisLevel = cars.filter(
    (c) => (c.minUnlockLevel ?? 1) === level && !ownedIds.has(c.id),
  );

  const purchasableCars = getPurchasableCars(ownedCars, level).map((c) =>
    cars.find((x) => x.id === c.id)!,
  );

  const upgrades = getUpgradesConfig().upgrades;
  let upgradeSlotsRemaining = 0;
  for (const instance of ownedCars) {
    for (const up of upgrades) {
      const lvl = getUpgradeLevel(instance, up.id);
      if (lvl < up.maxLevel) upgradeSlotsRemaining += up.maxLevel - lvl;
    }
  }

  return {
    newCarsThisLevel,
    purchasableCars,
    upgradesAvailable: upgradeSlotsRemaining > 0,
    upgradeSlotsRemaining,
  };
}
