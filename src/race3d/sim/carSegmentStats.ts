import { getCar } from "../../config/loadConfig";
import type { EffectiveStats } from "../../garage/stats";

/** Softer benefit from stacking stats far above 100 in physics checks. */
export function physicsStat(value: number): number {
  if (value <= 96) return value;
  if (value <= 100) return value;
  return 100 + (value - 100) * 0.22;
}

export function physicsGrip(stats: EffectiveStats): number {
  return physicsStat(stats.grip);
}

export function physicsHandling(stats: EffectiveStats): number {
  return physicsStat(stats.handling);
}

export function hasLoopSpecialist(stats: EffectiveStats): boolean {
  if (!stats.carId) return false;
  const t = getCar(stats.carId).trait;
  return !!(t?.loopGripBonus || t?.loopSpeedBonus);
}

export function hasRocketSpecialist(stats: EffectiveStats): boolean {
  if (!stats.carId) return false;
  return !!getCar(stats.carId).trait?.rocketBonus;
}

export function hasBoosterSpecialist(stats: EffectiveStats): boolean {
  if (!stats.carId) return false;
  return !!getCar(stats.carId).trait?.boosterBonus;
}

export function hasJumpSpecialist(stats: EffectiveStats): boolean {
  if (!stats.carId) return false;
  return !!getCar(stats.carId).trait?.jumpBonus;
}

/** Grip counted on loops — generalist max builds don't get full slick value. */
export function loopEffectiveGrip(stats: EffectiveStats): number {
  let g = physicsGrip(stats);
  if (hasLoopSpecialist(stats)) {
    const bonus = getCar(stats.carId).trait?.loopGripBonus ?? 0;
    g += bonus * 0.4;
  } else {
    g *= 0.82;
  }
  return g;
}

/** Multiplier on rocket-pad velocity cap (rocket / booster specialists only). */
export function rocketPadCapMult(stats: EffectiveStats): number {
  if (hasRocketSpecialist(stats)) return 1.12;
  if (hasBoosterSpecialist(stats)) return 1;
  return 0.54;
}

/** Weight used for jump physics (non jump-cars keep most of their base mass). */
export function jumpEffectiveWeight(stats: EffectiveStats): number {
  if (hasJumpSpecialist(stats)) return stats.weight;
  const base = getCar(stats.carId).stats.weight;
  return Math.max(stats.weight, Math.round(base * 0.92));
}

/** Extra weight factor on jumps for non jump-specialists. */
export function jumpWeightFactor(stats: EffectiveStats): number {
  const w = jumpEffectiveWeight(stats);
  const base = Math.pow(w / 50, 1.32);
  if (hasJumpSpecialist(stats)) return base;
  return base * (1.24 + Math.max(0, w - 44) * 0.014);
}

/** Top-speed tracks: grip-tank builds bleed time on long straights. */
export function speedTrackPaceMult(stats: EffectiveStats): number {
  if (hasBoosterSpecialist(stats) || hasRocketSpecialist(stats)) return 1;
  if (stats.carId === "grip-gt") return 0.98;
  if (hasJumpSpecialist(stats)) return 0.96;
  if (hasLoopSpecialist(stats)) return 0.94;
  return 0.84;
}
