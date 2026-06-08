import type { TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";

export interface SegmentCheckResult {
  ok: boolean;
  reason?: string;
}

function maxCurveSpeed(stats: EffectiveStats, radius: number): number {
  return ((stats.handling + stats.grip) / 2) * (radius / 30);
}

export function checkSegmentEntry(
  segment: TrackSegment,
  stats: EffectiveStats,
  velocity: number,
): SegmentCheckResult {
  switch (segment.type) {
    case "curve":
      if (stats.grip < segment.minGrip) {
        return { ok: false, reason: "Niet genoeg grip voor deze bocht!" };
      }
      if (velocity > maxCurveSpeed(stats, segment.radius) * 1.1) {
        const maxV = maxCurveSpeed(stats, segment.radius);
        if (velocity > maxV * 1.1 && stats.handling < segment.minGrip) {
          return {
            ok: false,
            reason: "Te hard de bocht in! Meer grip of handling nodig.",
          };
        }
      }
      return { ok: true };

    case "loop":
      if (stats.grip < segment.minGrip) {
        return { ok: false, reason: "Niet genoeg grip voor de loop!" };
      }
      if (velocity + stats.speed * 0.15 < segment.minEntrySpeed) {
        return { ok: false, reason: "Niet genoeg snelheid voor de loop!" };
      }
      return { ok: true };

    case "jump":
      if (velocity < segment.minSpeed) {
        return { ok: false, reason: "Te weinig snelheid voor de sprong!" };
      }
      if (stats.weight > segment.maxWeight) {
        return { ok: false, reason: "Auto te zwaar voor een veilige landing!" };
      }
      return { ok: true };

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
  const maxV = maxCurveSpeed(stats, segment.radius);
  if (velocity > maxV * 1.1 && stats.handling < segment.minGrip) {
    return {
      ok: false,
      reason: "Te hard de bocht in! Meer grip of handling nodig.",
    };
  }
  return { ok: true };
}
