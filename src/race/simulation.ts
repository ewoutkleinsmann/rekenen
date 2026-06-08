import type { TrackSegment } from "../config/schemas";
import type { EffectiveStats } from "../garage/stats";
import type { RaceKeyframe, SimulationResult } from "./types";

const DT = 1 / 60;
const MAX_TICKS = 6000;

function maxCurveSpeed(stats: EffectiveStats, radius: number): number {
  return ((stats.handling + stats.grip) / 2) * (radius / 30);
}

function accelRate(stats: EffectiveStats): number {
  return stats.acceleration * 1.5;
}

function maxSpeed(stats: EffectiveStats): number {
  return stats.speed * 1.5;
}

function boostVelocity(
  velocity: number,
  stats: EffectiveStats,
  multiplier: number,
): number {
  const boostFactor = 1 + (stats.boost / 100) * (multiplier - 1);
  return Math.max(velocity, 20) * boostFactor;
}

export function simulate(
  stats: EffectiveStats,
  segments: TrackSegment[],
): SimulationResult {
  let velocity = 0;
  let segmentProgress = 0;
  let segmentIndex = 0;
  let x = 0;
  let y = 0;
  const keyframes: RaceKeyframe[] = [];
  let tick = 0;

  const record = () => {
    if (tick % 3 === 0) {
      keyframes.push({ tick, x, y, velocity, segmentIndex });
    }
  };

  const fail = (reason: string): SimulationResult => ({
    success: false,
    failureReason: reason,
    failureSegmentIndex: segmentIndex,
    keyframes,
    totalTicks: tick,
  });

  while (segmentIndex < segments.length && tick < MAX_TICKS) {
    const segment = segments[segmentIndex]!;
    record();

    switch (segment.type) {
      case "straight": {
        velocity = Math.min(maxSpeed(stats), velocity + accelRate(stats) * DT);
        const step = velocity * DT;
        segmentProgress += step;
        x += step;
        if (segmentProgress >= segment.length) {
          segmentProgress = 0;
          segmentIndex++;
        }
        break;
      }
      case "curve": {
        const maxV = maxCurveSpeed(stats, segment.radius);
        if (stats.grip < segment.minGrip) {
          return fail("Niet genoeg grip voor deze bocht!");
        }
        if (velocity > maxV) {
          const brake = stats.handling * 4 * DT;
          velocity -= brake;
          if (velocity > maxV * 1.1 && stats.handling < segment.minGrip) {
            return fail("Te hard de bocht in! Meer grip of handling nodig.");
          }
        }
        velocity = Math.min(
          maxV,
          Math.max(velocity, 0) + accelRate(stats) * DT * 0.3,
        );
        const arcLength = (segment.angle / 360) * 2 * Math.PI * segment.radius;
        const step = velocity * DT;
        segmentProgress += step;
        x += step * 0.8;
        y += Math.sin(segmentProgress / Math.max(segment.radius, 1)) * 1.5;
        if (segmentProgress >= arcLength) {
          segmentProgress = 0;
          segmentIndex++;
          y = 0;
        }
        break;
      }
      case "booster": {
        velocity = boostVelocity(velocity, stats, segment.boostMultiplier);
        x += velocity * DT * 2;
        segmentIndex++;
        break;
      }
      case "loop": {
        const effectiveEntry = velocity + stats.speed * 0.15;
        if (effectiveEntry < segment.minEntrySpeed) {
          return fail("Niet genoeg snelheid voor de loop!");
        }
        if (stats.grip < segment.minGrip) {
          return fail("Niet genoeg grip voor de loop!");
        }
        const loopLength = 2 * Math.PI * segment.radius;
        const step = velocity * DT;
        segmentProgress += step;
        y -= 2;
        x += step * 0.6;
        if (segmentProgress >= loopLength) {
          segmentProgress = 0;
          segmentIndex++;
          y = 0;
        }
        break;
      }
      case "jump": {
        velocity = Math.min(maxSpeed(stats), velocity + accelRate(stats) * DT);
        if (velocity < segment.minSpeed) {
          return fail("Te weinig snelheid voor de sprong!");
        }
        if (stats.weight > segment.maxWeight) {
          return fail("Auto te zwaar voor een veilige landing!");
        }
        const step = velocity * DT;
        segmentProgress += step;
        y -= 5;
        x += step;
        if (segmentProgress >= segment.length) {
          segmentProgress = 0;
          segmentIndex++;
          y = 0;
        }
        break;
      }
      case "rocket": {
        if (!stats.unlocks.includes("rocket-segment")) {
          return fail("Je hebt Baan Blaster Rockets nodig voor dit stuk!");
        }
        velocity = boostVelocity(velocity, stats, segment.boostMultiplier);
        x += velocity * DT * 2;
        segmentIndex++;
        break;
      }
      default:
        segmentIndex++;
    }

    tick++;
  }

  record();

  if (segmentIndex < segments.length) {
    return fail("Race duurde te lang — meer snelheid nodig!");
  }

  return {
    success: true,
    keyframes,
    totalTicks: tick,
  };
}

export function simulateRace(
  stats: EffectiveStats,
  segments: TrackSegment[],
): SimulationResult {
  return simulate(stats, segments);
}
