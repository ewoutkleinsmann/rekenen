import type { TrackConfig } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import {
  buildTrack3d,
  nodeAtDist,
  segmentMetaAtDist,
  type Track3D,
} from "./buildTrack3d";
import {
  checkCurveOngoing,
  checkSegmentEntry,
  maxCurveSpeed,
} from "./segmentRules";
import {
  CAR_RIDE_HEIGHT,
  DIST_SCALE,
  FRAME_INTERVAL,
  MAX_TICKS,
  MIN_PLAYBACK_MS,
  SIM_DT,
  WHEEL_RADIUS,
} from "./simConstants";
import type { RaceReplay, ReplayFrame } from "./types";
import { createPhysicsWorld, ensureRapier } from "./vehicle";
import {
  add,
  cross,
  dot,
  normalize,
  quatFromFrame,
  rotateAround,
  scale,
  type Quat,
  type Vec3,
} from "./vec3";

const ACCEL_FACTOR = 1.5;
const SPEED_FACTOR = 1.5;
const LOOKAHEAD = 6;

function maxSpeed(stats: EffectiveStats): number {
  return stats.speed * SPEED_FACTOR;
}

function accelRate(stats: EffectiveStats): number {
  return stats.acceleration * ACCEL_FACTOR;
}

function boostVelocity(
  velocity: number,
  stats: EffectiveStats,
  multiplier: number,
): number {
  const factor = 1 + (stats.boost / 100) * (multiplier - 1);
  return Math.max(velocity, 20) * factor;
}

/** Apply visual banking roll to the road up-vector around the forward axis. */
function bankedUp(forward: Vec3, up: Vec3, banking: number): Vec3 {
  if (Math.abs(banking) < 1e-4) return up;
  return normalize(rotateAround(up, forward, banking));
}

function poseAt(track: Track3D, dist: number): { pos: Vec3; quat: Quat } {
  const node = nodeAtDist(track.nodes, dist);
  const up = bankedUp(node.forward, node.up, node.banking);
  const pos = add(node.pos, scale(node.up, CAR_RIDE_HEIGHT));
  return { pos, quat: quatFromFrame(node.forward, up) };
}

function steerAt(track: Track3D, dist: number): number {
  const here = nodeAtDist(track.nodes, dist);
  const ahead = nodeAtDist(track.nodes, dist + LOOKAHEAD);
  const right = normalize(cross(here.up, here.forward));
  const lateral = dot(ahead.forward, right);
  return Math.max(-0.5, Math.min(0.5, lateral * 1.6));
}

export async function simulateRace3D(
  stats: EffectiveStats,
  track: TrackConfig,
): Promise<RaceReplay> {
  await ensureRapier();
  const built = buildTrack3d(track);

  const startPose = poseAt(built, 0);
  const physics = createPhysicsWorld(built, startPose.pos);

  const frames: ReplayFrame[] = [];
  const entered = new Set<number>([0]);

  let tick = 0;
  let dist = 0;
  let velocity = 0;
  let wheelSpin = 0;

  let failureReason: string | undefined;
  let failureSegmentIndex: number | undefined;
  let success = false;

  const record = (
    t: number,
    pos: Vec3,
    quat: Quat,
    speed: number,
    steer: number,
    boosting: boolean,
    airborne: boolean,
    segmentIndex: number,
  ) => {
    frames.push({
      t,
      pos,
      quat,
      wheelSpin,
      steer,
      speed,
      boosting,
      airborne,
      segmentIndex,
    });
  };

  // Initial frame.
  {
    const { pos, quat } = physics.read();
    record(0, pos, quat, 0, 0, false, false, 0);
  }

  while (tick < MAX_TICKS) {
    const meta = segmentMetaAtDist(built.segments, dist);
    const seg = meta.segment;
    const segIndex = meta.index;

    // Segment-entry gating.
    if (!entered.has(segIndex)) {
      entered.add(segIndex);
      const check = checkSegmentEntry(seg, stats, velocity);
      if (!check.ok) {
        failureReason = check.reason;
        failureSegmentIndex = segIndex;
        break;
      }
    }

    // Ongoing curve check.
    if (seg.type === "curve") {
      const ongoing = checkCurveOngoing(seg, stats, velocity);
      if (!ongoing.ok) {
        failureReason = ongoing.reason;
        failureSegmentIndex = segIndex;
        break;
      }
    }

    const node = nodeAtDist(built.nodes, dist);
    const airborne = !node.solid;
    let boosting = false;

    switch (seg.type) {
      case "straight":
        velocity = Math.min(maxSpeed(stats), velocity + accelRate(stats) * SIM_DT);
        break;
      case "curve": {
        const maxV = maxCurveSpeed(stats, seg.radius);
        if (velocity > maxV) velocity -= stats.handling * 4 * SIM_DT;
        velocity = Math.min(
          maxV,
          Math.max(velocity, 0) + accelRate(stats) * SIM_DT * 0.3,
        );
        break;
      }
      case "booster":
      case "rocket":
        velocity = boostVelocity(velocity, stats, seg.boostMultiplier);
        boosting = true;
        break;
      case "loop":
        velocity = Math.max(velocity, maxSpeed(stats) * 0.6);
        break;
      case "jump":
        if (!airborne) {
          velocity = Math.min(
            maxSpeed(stats),
            velocity + accelRate(stats) * SIM_DT,
          );
        }
        break;
    }

    dist += velocity * DIST_SCALE * SIM_DT;
    wheelSpin += ((velocity * DIST_SCALE) / WHEEL_RADIUS) * SIM_DT;

    if (dist >= built.finishDist) {
      dist = built.finishDist;
      success = true;
    }

    const { pos, quat } = poseAt(built, dist);
    physics.step(pos, quat);
    const read = physics.read();
    const steer = steerAt(built, dist);

    tick++;
    const t = tick * SIM_DT;
    if (tick % FRAME_INTERVAL === 0 || success) {
      record(
        t,
        read.pos,
        read.quat,
        velocity,
        steer,
        boosting,
        airborne,
        segIndex,
      );
    }

    if (success) break;
  }

  physics.free();

  if (!success && failureReason === undefined && tick >= MAX_TICKS) {
    failureReason = "Race duurde te lang — meer snelheid nodig!";
    failureSegmentIndex = track.segments.length - 1;
  }

  const totalTime = frames.length > 0 ? frames[frames.length - 1]!.t : 0;
  const durationMs = Math.max(MIN_PLAYBACK_MS, totalTime * 1000);

  return {
    frames,
    durationMs,
    success,
    failureReason,
    failureSegmentIndex,
    totalTime,
  };
}
