import type { CarInstance } from "../../game/types";

function inst(
  carId: string,
  upgrades: CarInstance["upgrades"] = [],
): CarInstance {
  return { instanceId: `${carId}-test`, carId, upgrades };
}

/** Named builds used by progression / balance tests. */
export const PROGRESSION_LOADOUTS = {
  starter: inst("booster-blaze"),
  starterSlicks2: inst("booster-blaze", [{ upgradeId: "slicks", level: 2 }]),
  starterMid: inst("booster-blaze", [
    { upgradeId: "slicks", level: 2 },
    { upgradeId: "super-charger-motor", level: 1 },
  ]),
  starterFull: inst("booster-blaze", [
    { upgradeId: "slicks", level: 5 },
    { upgradeId: "sport-steering", level: 5 },
    { upgradeId: "super-charger-motor", level: 5 },
    { upgradeId: "lightweight-chassis", level: 3 },
    { upgradeId: "power-booster-kit", level: 4 },
    { upgradeId: "baan-blaster-rockets", level: 1 },
  ]),
  gripGtSlicks3: inst("grip-gt", [{ upgradeId: "slicks", level: 3 }]),
  gripGtSlicks5: inst("grip-gt", [{ upgradeId: "slicks", level: 5 }]),
  gripGtMax: inst("grip-gt", [
    { upgradeId: "slicks", level: 5 },
    { upgradeId: "sport-steering", level: 5 },
    { upgradeId: "super-charger-motor", level: 5 },
    { upgradeId: "lightweight-chassis", level: 3 },
    { upgradeId: "baan-blaster-rockets", level: 1 },
  ]),
  jumpJetLight: inst("jump-jet", [
    { upgradeId: "lightweight-chassis", level: 2 },
    { upgradeId: "super-charger-motor", level: 2 },
  ]),
  jumpJetMax: inst("jump-jet", [
    { upgradeId: "lightweight-chassis", level: 3 },
    { upgradeId: "super-charger-motor", level: 4 },
    { upgradeId: "slicks", level: 2 },
    { upgradeId: "sport-steering", level: 2 },
  ]),
  loopKingMid: inst("loop-king", [
    { upgradeId: "slicks", level: 2 },
    { upgradeId: "super-charger-motor", level: 2 },
  ]),
  loopKingHigh: inst("loop-king", [
    { upgradeId: "slicks", level: 4 },
    { upgradeId: "super-charger-motor", level: 4 },
    { upgradeId: "sport-steering", level: 3 },
  ]),
  rocketRacerKit: inst("rocket-racer", [
    { upgradeId: "baan-blaster-rockets", level: 1 },
    { upgradeId: "super-charger-motor", level: 3 },
    { upgradeId: "slicks", level: 2 },
  ]),
  rocketRacerMax: inst("rocket-racer", [
    { upgradeId: "baan-blaster-rockets", level: 1 },
    { upgradeId: "super-charger-motor", level: 5 },
    { upgradeId: "slicks", level: 5 },
    { upgradeId: "sport-steering", level: 4 },
    { upgradeId: "lightweight-chassis", level: 3 },
    { upgradeId: "power-booster-kit", level: 4 },
  ]),
  blazeSpeed5: inst("booster-blaze", [
    { upgradeId: "super-charger-motor", level: 5 },
    { upgradeId: "power-booster-kit", level: 4 },
    { upgradeId: "slicks", level: 3 },
  ]),
} as const satisfies Record<string, CarInstance>;

export type ProgressionLoadoutId = keyof typeof PROGRESSION_LOADOUTS;

export async function simulateLoadoutOnTrack(
  loadoutId: ProgressionLoadoutId,
  trackId: string,
): Promise<{ success: boolean; failureReason?: string }> {
  const { simulateRace3D } = await import("./simulateRace3d");
  const { getTrack } = await import("../../config/loadConfig");
  const { computeEffectiveStats } = await import("../../garage/stats");
  const instance = PROGRESSION_LOADOUTS[loadoutId];
  const result = await simulateRace3D(
    computeEffectiveStats(instance),
    getTrack(trackId),
  );
  return { success: result.success, failureReason: result.failureReason };
}
