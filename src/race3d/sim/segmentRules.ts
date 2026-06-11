import type { TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import {
  hasLoopSpecialist,
  hasBoosterSpecialist,
  hasRocketSpecialist,
  loopEffectiveGrip,
  physicsGrip,
  physicsHandling,
} from "./carSegmentStats";
import {
  curveSharpness,
  jumpFailureReason,
  loopMinEntrySpeed,
  loopRequiredGrip,
  requiredGripForCurve,
  requiredHandlingForCurveOverspeed,
} from "./segmentPhysics";

export { curveSharpness } from "./segmentPhysics";

export interface SegmentCheckResult {
  ok: boolean;
  reason?: string;
}

export interface FlyOffResult {
  fly: boolean;
  reason?: string;
}

export function maxCurveSpeed(stats: EffectiveStats, radius: number): number {
  return (
    ((physicsHandling(stats) + physicsGrip(stats)) / 2) * (radius / 30)
  );
}

export function maxCurveSpeedForSegment(
  stats: EffectiveStats,
  segment: TrackSegment & { type: "curve" },
): number {
  const base = maxCurveSpeed(stats, segment.radius);
  const sharp = curveSharpness(segment);
  return base / Math.max(1, sharp);
}

export function shouldFlyOffCurve(
  segment: TrackSegment & { type: "curve" },
  stats: EffectiveStats,
  velocity: number,
): FlyOffResult {
  const maxV = maxCurveSpeedForSegment(stats, segment);
  if (velocity < 6) return { fly: false };

  const vRatio = velocity / Math.max(maxV, 1);

  // Within the car's safe line speed for this bend — geometry alone is OK.
  if (vRatio <= 1.02) return { fly: false };

  const overshoot = vRatio - 1;
  const gripNeeded =
    requiredGripForCurve(segment, velocity) * (1 + overshoot * 1.4);
  if (physicsGrip(stats) < gripNeeded) {
    return { fly: true, reason: "Te weinig grip — uit de bocht!" };
  }

  const handlingNeeded = requiredHandlingForCurveOverspeed(
    segment,
    velocity,
    maxV,
  );
  if (physicsHandling(stats) < handlingNeeded && vRatio > 1.1) {
    return { fly: true, reason: "Te hard de bocht in!" };
  }

  if (vRatio > 1.32) {
    return { fly: true, reason: "Te hard de bocht in!" };
  }

  return { fly: false };
}

export function shouldFlyOffLoop(
  segment: TrackSegment & { type: "loop" },
  stats: EffectiveStats,
  velocity: number,
  opts?: {
    progress?: number;
    climbWorldUp?: number;
  },
): FlyOffResult {
  const minEntry =
    loopMinEntrySpeed(segment.radius) *
    (hasLoopSpecialist(stats) ? 0.98 : hasRocketSpecialist(stats) ? 0.9 : 1.06);
  let gripNeeded = loopRequiredGrip(segment.radius, velocity);
  if (hasRocketSpecialist(stats)) gripNeeded *= 0.74;
  const grip = loopEffectiveGrip(stats);
  const progress = opts?.progress ?? 0;

  if (progress > 0.1 && grip < gripNeeded) {
    return { fly: true, reason: "Te weinig grip voor de loop!" };
  }
  if (progress <= 0.1 && grip < gripNeeded * 0.76) {
    return { fly: true, reason: "Te weinig grip voor de loop!" };
  }

  const speedBonus = hasLoopSpecialist(stats)
    ? stats.speed * 0.15
    : hasRocketSpecialist(stats)
      ? stats.speed * 0.22
      : stats.speed * 0.08;
  const entry = velocity + speedBonus;
  if (entry < minEntry) {
    if (opts?.progress === undefined || opts.progress < 0.12) {
      return { fly: true, reason: "Niet genoeg snelheid voor de loop!" };
    }
  }

  const climb = opts?.climbWorldUp ?? 1;
  if (progress > 0.18 && velocity < minEntry * 0.68) {
    return { fly: true, reason: "Niet genoeg snelheid voor de loop!" };
  }
  if (progress > 0.32 && climb < 0.4 && velocity < minEntry * 0.8) {
    return { fly: true, reason: "Niet genoeg snelheid voor de loop!" };
  }
  return { fly: false };
}

export function shouldFlyOffJump(
  segment: TrackSegment & { type: "jump" },
  stats: EffectiveStats,
  velocity: number,
): FlyOffResult {
  const reason = jumpFailureReason(segment, stats, velocity);
  if (reason) {
    return { fly: true, reason };
  }
  return { fly: false };
}

export function shouldFlyOffRocket(
  segment: TrackSegment & { type: "rocket" },
  stats: EffectiveStats,
  velocity: number,
): FlyOffResult {
  if (hasRocketSpecialist(stats) || hasBoosterSpecialist(stats)) {
    return { fly: false };
  }
  return {
    fly: true,
    reason: "Raketstuk — kies Rocket Racer of volle boost op Booster Blaze!",
  };
}

export function checkSegmentEntry(
  segment: TrackSegment,
  stats: EffectiveStats,
  _velocity: number,
): SegmentCheckResult {
  switch (segment.type) {
    case "rocket":
      if (!stats.unlocks.includes("rocket-segment")) {
        return {
          ok: false,
          reason: "Je hebt Baan Blaster Rockets nodig voor dit stuk!",
        };
      }
      return { ok: true };

    default:
      return { ok: true };
  }
}

/** @deprecated Use shouldFlyOffCurve in the sim loop. */
export function checkCurveOngoing(
  segment: TrackSegment & { type: "curve" },
  stats: EffectiveStats,
  velocity: number,
): SegmentCheckResult {
  const off = shouldFlyOffCurve(segment, stats, velocity);
  if (off.fly) {
    return { ok: false, reason: off.reason };
  }
  return { ok: true };
}
