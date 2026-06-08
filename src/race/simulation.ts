import type { TrackSegment } from "../config/schemas";
import type { EffectiveStats } from "../garage/stats";
import type { RaceKeyframe, SimulationResult } from "./types";
import { createCarBody } from "./physics/carFactory";
import { createRaceEngine } from "./physics/engine";
import {
  KEYFRAME_INTERVAL,
  MAX_TICKS,
  MIN_RACE_MS,
  SIM_DT,
  TRACK_Y,
} from "./physics/constants";
import { checkCurveOngoing, checkSegmentEntry } from "./physics/segmentRules";
import {
  buildTrack,
  getSegmentAtDist,
  pointAtDist,
} from "./physics/trackBuilder";
import Matter from "matter-js";

/** Converts game velocity stat to pixels advanced per simulation tick. */
const PX_PER_TICK_SCALE = 2.5;

export function getPlaybackDurationMs(totalTicks: number): number {
  const simMs = totalTicks * SIM_DT * 1000;
  return Math.max(MIN_RACE_MS, simMs);
}

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

function recordKeyframe(
  keyframes: RaceKeyframe[],
  tick: number,
  pt: { x: number; y: number; angle: number },
  velocity: number,
  segmentIndex: number,
  boosting: boolean,
  airborne: boolean,
) {
  keyframes.push({
    tick,
    x: pt.x,
    y: pt.y,
    angle: pt.angle,
    velocity,
    segmentIndex,
    boosting,
    airborne,
  });
}

function fail(
  reason: string,
  segmentIndex: number,
  keyframes: RaceKeyframe[],
  tick: number,
): SimulationResult {
  return {
    success: false,
    failureReason: reason,
    failureSegmentIndex: segmentIndex,
    keyframes,
    totalTicks: tick,
  };
}

interface CrossFail {
  segIdx: number;
  reason: string;
}

function checkCrossedSegments(
  track: ReturnType<typeof buildTrack>,
  stats: EffectiveStats,
  velocity: number,
  from: number,
  to: number,
  entered: Set<number>,
): CrossFail | null {
  for (const meta of track.segments) {
    const boundary = meta.startDist;
    if (from < boundary && to >= boundary && !entered.has(meta.index)) {
      entered.add(meta.index);
      const check = checkSegmentEntry(meta.segment, stats, velocity);
      if (!check.ok) return { segIdx: meta.index, reason: check.reason! };
    }
  }
  return null;
}

export function simulate(
  stats: EffectiveStats,
  segments: TrackSegment[],
): SimulationResult {
  const track = buildTrack(segments);
  const engine = createRaceEngine();
  Matter.World.add(engine.world, [...track.bodies, ...track.sensors]);

  const startPt = track.pathPoints[0]!;
  const car = createCarBody(stats, startPt.x, TRACK_Y);
  Matter.World.add(engine.world, car.body);

  const keyframes: RaceKeyframe[] = [];
  let tick = 0;
  let velocity = 0;
  let pathDist = 0;
  const enteredSegments = new Set<number>([0]);
  let boosting = false;

  recordKeyframe(keyframes, 0, startPt, 0, 0, false, false);

  const failAt = (reason: string, segIdx: number): SimulationResult =>
    fail(reason, segIdx, keyframes, tick);

  while (tick < MAX_TICKS) {
    const segMeta = getSegmentAtDist(track.segments, pathDist);
    const currentSegment = segMeta.index;
    const seg = segMeta.segment;

    if (seg.type === "curve") {
      const ongoing = checkCurveOngoing(seg, stats, velocity);
      if (!ongoing.ok) {
        const pt = pointAtDist(track.pathPoints, pathDist);
        recordKeyframe(
          keyframes,
          tick,
          pt,
          velocity,
          currentSegment,
          boosting,
          false,
        );
        return failAt(ongoing.reason!, currentSegment);
      }
    }

    boosting = false;
    const airborne = seg.type === "jump" && pathDist > segMeta.startDist + 20;

    switch (seg.type) {
      case "straight":
        velocity = Math.min(
          maxSpeed(stats),
          velocity + accelRate(stats) * SIM_DT,
        );
        break;
      case "curve": {
        const maxV = maxCurveSpeed(stats, seg.radius);
        if (velocity > maxV) {
          velocity -= stats.handling * 4 * SIM_DT;
        }
        velocity = Math.min(
          maxV,
          Math.max(velocity, 0) + accelRate(stats) * SIM_DT * 0.3,
        );
        break;
      }
      case "booster":
        velocity = boostVelocity(velocity, stats, seg.boostMultiplier);
        boosting = true;
        break;
      case "rocket":
        velocity = boostVelocity(velocity, stats, seg.boostMultiplier);
        boosting = true;
        break;
      case "loop":
        velocity = Math.max(velocity, maxSpeed(stats) * 0.6);
        break;
      case "jump":
        velocity = Math.min(
          maxSpeed(stats),
          velocity + accelRate(stats) * SIM_DT,
        );
        break;
    }

    const prevDist = pathDist;
    pathDist += velocity * SIM_DT * PX_PER_TICK_SCALE;

    const crossed = checkCrossedSegments(
      track,
      stats,
      velocity,
      prevDist,
      pathDist,
      enteredSegments,
    );
    if (crossed) {
      const pt = pointAtDist(track.pathPoints, pathDist);
      recordKeyframe(
        keyframes,
        tick,
        pt,
        velocity,
        crossed.segIdx,
        boosting,
        false,
      );
      return failAt(crossed.reason, crossed.segIdx);
    }

    const targetPt = pointAtDist(track.pathPoints, pathDist);

    if (tick % KEYFRAME_INTERVAL === 0) {
      recordKeyframe(
        keyframes,
        tick,
        targetPt,
        velocity,
        currentSegment,
        boosting,
        airborne,
      );
    }

    if (pathDist >= track.totalLength * 0.98) {
      const finishPt = pointAtDist(track.pathPoints, track.totalLength);
      recordKeyframe(
        keyframes,
        tick,
        finishPt,
        velocity,
        segments.length - 1,
        false,
        false,
      );
      return { success: true, keyframes, totalTicks: tick };
    }

    tick++;
  }

  return failAt(
    "Race duurde te lang — meer snelheid nodig!",
    segments.length - 1,
  );
}

export function simulateRace(
  stats: EffectiveStats,
  segments: TrackSegment[],
): SimulationResult {
  return simulate(stats, segments);
}
