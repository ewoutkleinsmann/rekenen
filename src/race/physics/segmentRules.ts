import type { TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import {
  jumpFailureReason,
  loopMinEntrySpeed,
  loopRequiredGrip,
} from "../../race3d/sim/segmentPhysics";
import { shouldFlyOffCurve } from "../../race3d/sim/segmentRules";

export interface SegmentCheckResult {
  ok: boolean;
  reason?: string;
}

export function checkSegmentEntry(
  segment: TrackSegment,
  stats: EffectiveStats,
  velocity: number,
): SegmentCheckResult {
  switch (segment.type) {
    case "curve": {
      const off = shouldFlyOffCurve(segment, stats, velocity);
      if (off.fly) {
        return { ok: false, reason: off.reason ?? "Uit de bocht!" };
      }
      return { ok: true };
    }

    case "loop": {
      if (stats.grip < loopRequiredGrip(segment.radius, velocity)) {
        return { ok: false, reason: "Niet genoeg grip voor de loop!" };
      }
      if (velocity + stats.speed * 0.15 < loopMinEntrySpeed(segment.radius)) {
        return { ok: false, reason: "Niet genoeg snelheid voor de loop!" };
      }
      return { ok: true };
    }

    case "jump": {
      const reason = jumpFailureReason(segment, stats, velocity);
      if (reason) {
        return { ok: false, reason };
      }
      return { ok: true };
    }

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
