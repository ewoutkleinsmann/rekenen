import type { TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import { jumpEffectiveWeight, jumpWeightFactor } from "./carSegmentStats";
import { DIST_SCALE } from "./simConstants";

/**
 * Pure geometry + speed → stat demands. Track JSON only describes shape
 * (radius, angle, length, boost); no minGrip / minSpeed thresholds.
 */

/** Tighter / sharper curves demand more from the car at the same speed. */
export function curveSharpness(
  segment: TrackSegment & { type: "curve" },
): number {
  const angleFactor = segment.angle / 45;
  const radiusFactor = 35 / Math.max(segment.radius, 5);
  return angleFactor * radiusFactor;
}

/** Lateral “load” from speed and bend radius (game velocity units). */
export function lateralLoad(velocity: number, radius: number): number {
  return (velocity * velocity) / Math.max(radius, 6);
}

/** Grip stat needed to stay on a curve at this speed. */
export function requiredGripForCurve(
  segment: TrackSegment & { type: "curve" },
  velocity: number,
): number {
  const sharp = curveSharpness(segment);
  const lateral = lateralLoad(velocity, segment.radius);
  const GRIP_PER_LATERAL = 0.52;
  return lateral * sharp * GRIP_PER_LATERAL;
}

/** Handling demand when entering faster than the car’s own safe line speed. */
export function requiredHandlingForCurveOverspeed(
  segment: TrackSegment & { type: "curve" },
  velocity: number,
  safeSpeed: number,
): number {
  const vRatio = velocity / Math.max(safeSpeed, 1);
  if (vRatio <= 1.05) return 0;
  const grip = requiredGripForCurve(segment, velocity);
  return grip * Math.max(0, vRatio - 0.82);
}

/** Minimum entry speed to complete a vertical loop of this radius. */
export function loopMinEntrySpeed(radius: number): number {
  return 50 + 780 / Math.max(radius, 12);
}

/** Grip needed on a loop at entry speed (scales with radius, not peak booster speed). */
export function loopRequiredGrip(radius: number, velocity: number): number {
  const r = Math.max(radius, 12);
  const minE = loopMinEntrySpeed(r);
  const v = Math.min(Math.max(velocity, minE * 0.6), minE * 1.2);
  return (v * v) / r * 0.19 + 86 / r;
}

/** Minimum speed to clear a jump gap; heavier cars need more. */
export function jumpMinSpeed(length: number, weightOrStats: number | EffectiveStats): number {
  const stats: EffectiveStats =
    typeof weightOrStats === "number"
      ? {
          carId: "booster-blaze",
          weight: weightOrStats,
          speed: 50,
          acceleration: 50,
          handling: 50,
          grip: 50,
          boost: 50,
          unlocks: [],
          jumpLandingBonus: 0,
        }
      : weightOrStats;
  const base = 24 + length * 0.55;
  return base * jumpWeightFactor(stats);
}

/** Heaviest car that can land safely at this speed and gap length. */
export function jumpMaxSafeWeight(length: number, velocity: number): number {
  return 15 + velocity * 0.52 - length * 0.16;
}

/** Max weight the car can carry at this speed (includes jump-car landing bonus). */
export function jumpLandingWeightBudget(
  length: number,
  velocity: number,
  stats: EffectiveStats,
  jumpLandingBonus: number,
): number {
  const weight = jumpEffectiveWeight(stats);
  const heavyLandingPenalty = Math.max(0, weight - 50) * 1.75;
  return (
    jumpMaxSafeWeight(length, velocity) +
    jumpLandingBonus -
    heavyLandingPenalty
  );
}

/**
 * Minimum speed to land safely at this weight (can exceed gap-clear speed on
 * long jumps / heavy cars).
 */
export function jumpMinSpeedForSafeLanding(
  length: number,
  stats: EffectiveStats,
  jumpLandingBonus: number,
): number {
  const weight = jumpEffectiveWeight(stats);
  const heavyLandingPenalty = Math.max(0, weight - 50) * 1.75;
  const numer =
    weight - jumpLandingBonus + heavyLandingPenalty + length * 0.16 - 15;
  if (numer <= 0) return 0;
  return numer / 0.52;
}

export function jumpFailureReason(
  segment: TrackSegment & { type: "jump" },
  stats: { weight: number; jumpLandingBonus: number },
  velocity: number,
): string | null {
  const minGap = jumpMinSpeed(segment.length, stats);
  const minLand = Math.max(
    minGap,
    jumpMinSpeedForSafeLanding(
      segment.length,
      stats,
      stats.jumpLandingBonus,
    ),
  );

  if (velocity < minGap) {
    return jumpEffectiveWeight(stats) > 52
      ? "Te weinig snelheid — zware auto heeft meer vaart voor deze sprong!"
      : "Te weinig snelheid voor de sprong!";
  }

  const budget = jumpLandingWeightBudget(
    segment.length,
    velocity,
    stats,
    stats.jumpLandingBonus,
  );
  if (jumpEffectiveWeight(stats) > budget) {
    if (velocity < minLand * 0.99) {
      return jumpEffectiveWeight(stats) > 52
        ? "Te weinig snelheid — zware auto heeft meer vaart voor deze sprong!"
        : "Te weinig snelheid voor de sprong!";
    }
    return "Sprong te lang of auto te zwaar — mislukte landing!";
  }

  return null;
}

/**
 * Par time derived from track length and tier (1–9). Faster average speed
 * required on higher tiers.
 */
export function raceTimeLimitSeconds(
  finishDist: number,
  tier: number,
): number {
  const minAvgVelocity = 36 + tier * 2.75;
  const seconds = finishDist / (minAvgVelocity * DIST_SCALE);
  const grace =
    tier <= 2
      ? 1.4
      : tier === 3
        ? 0.96
        : tier <= 5
          ? 1.16
          : tier <= 6
            ? 0.94
            : tier <= 7
              ? 1.04
              : 0.98;
  return seconds * grace;
}
