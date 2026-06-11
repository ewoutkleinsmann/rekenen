import type { CarStats, TrackConfig, TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import {
  buildTrack3d,
  nodeAtDist,
  segmentMetaAtDist,
  type Track3D,
} from "./buildTrack3d";
import {
  startCurveOffTrack,
  startJumpBail,
  startLoopStall,
  tickCurveOffTrack,
  tickJumpBail,
  tickLoopStall,
  type CurveOffTrackAnim,
  type FailureAnim,
  type JumpBailAnim,
  type LoopStallAnim,
} from "./failureAnim";
import {
  checkSegmentEntry,
  maxCurveSpeedForSegment,
  shouldFlyOffCurve,
  shouldFlyOffJump,
  shouldFlyOffLoop,
  shouldFlyOffRocket,
} from "./segmentRules";
import {
  rocketPadCapMult,
  speedTrackPaceMult,
} from "./carSegmentStats";
import { resolveTrackTimeLimitSec } from "./trackTimeLimit";
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
const BOOST_VELOCITY_CAP_MULT = 2.35;

export interface SimulateRace3DOptions {
  /** Dev / tuning: override numeric stats (unlocks stay from base stats). */
  statOverrides?: Partial<CarStats>;
}

function mergeStats(
  stats: EffectiveStats,
  options?: SimulateRace3DOptions,
): EffectiveStats {
  if (!options?.statOverrides) return stats;
  return { ...stats, ...options.statOverrides };
}

function maxSpeed(stats: EffectiveStats): number {
  return stats.speed * SPEED_FACTOR;
}

function accelRate(stats: EffectiveStats): number {
  return stats.acceleration * ACCEL_FACTOR;
}

function boostCap(
  stats: EffectiveStats,
  multiplier: number,
  segmentType: TrackSegment["type"],
): number {
  const factor = 1 + (stats.boost / 100) * (multiplier - 1);
  let cap =
    maxSpeed(stats) *
    Math.min(multiplier * 1.1, BOOST_VELOCITY_CAP_MULT) *
    factor;
  if (segmentType === "rocket") {
    cap *= rocketPadCapMult(stats);
  }
  return cap;
}

/** One-shot pad boost (not per-frame multiply). */
function applyPadBoost(
  velocity: number,
  stats: EffectiveStats,
  multiplier: number,
  segmentType: TrackSegment["type"],
): number {
  const factor = 1 + (stats.boost / 100) * (multiplier - 1);
  const boosted = Math.max(velocity, 15) * factor;
  return Math.min(boosted, boostCap(stats, multiplier, segmentType));
}

/** Apply visual banking roll to the road up-vector around the forward axis. */
function bankedUp(forward: Vec3, up: Vec3, banking: number): Vec3 {
  if (Math.abs(banking) < 1e-4) return up;
  return normalize(rotateAround(up, forward, banking));
}

function poseAt(track: Track3D, dist: number): { pos: Vec3; quat: Quat } {
  const node = nodeAtDist(track.nodes, dist);
  const up = bankedUp(node.forward, node.up, node.banking);
  const pos = add(node.pos, scale(up, CAR_RIDE_HEIGHT));
  return { pos, quat: quatFromFrame(node.forward, up) };
}

function steerAt(track: Track3D, dist: number): number {
  const here = nodeAtDist(track.nodes, dist);
  const ahead = nodeAtDist(track.nodes, dist + LOOKAHEAD);
  const right = normalize(cross(here.up, here.forward));
  const lateral = dot(ahead.forward, right);
  return Math.max(-0.5, Math.min(0.5, lateral * 1.6));
}

function lateralSignForSegment(
  seg: TrackConfig["segments"][number],
): number {
  if (seg.type === "curve") {
    return seg.direction === "left" ? -1 : 1;
  }
  return 1;
}

const CURVE_BRAKE = 6;

function brakeTowardCurveLimit(
  velocity: number,
  stats: EffectiveStats,
  curve: TrackSegment & { type: "curve" },
): number {
  const maxV = maxCurveSpeedForSegment(stats, curve);
  if (velocity <= maxV) return velocity;
  return Math.max(0, velocity - stats.handling * CURVE_BRAKE * SIM_DT);
}

export async function simulateRace3D(
  stats: EffectiveStats,
  track: TrackConfig,
  options?: SimulateRace3DOptions,
): Promise<RaceReplay> {
  const effective = mergeStats(stats, options);
  await ensureRapier();
  const built = buildTrack3d(track);
  const timeLimitSec = resolveTrackTimeLimitSec(track, built.finishDist);

  const startPose = poseAt(built, 0);
  const physics = createPhysicsWorld(built, startPose.pos);

  const frames: ReplayFrame[] = [];
  const entered = new Set<number>([0]);
  const boostApplied = new Set<number>();

  let tick = 0;
  let dist = 0;
  let velocity = 0;
  let wheelSpin = 0;

  let failureReason: string | undefined;
  let failureSegmentIndex: number | undefined;
  let success = false;
  let failure: FailureAnim | null = null;

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

  {
    const { pos, quat } = physics.read();
    record(0, pos, quat, 0, 0, false, false, 0);
  }

  while (tick < MAX_TICKS) {
    const meta = segmentMetaAtDist(built.segments, dist);
    const seg = meta.segment;
    const segIndex = meta.index;

    if (failure) {
      let pos: Vec3;
      let quat: Quat;
      let speed = velocity;
      let airborne = false;
      const segIdx = failure.segmentIndex;

      if (failure.kind === "curve_offtrack") {
        const anim = failure as CurveOffTrackAnim;
        const step = tickCurveOffTrack(anim, built, dist);
        dist = step.dist;
        pos = step.pos;
        quat = step.quat;
        speed = anim.alongVel;
        airborne = step.airborne;
        failure = anim.ticksLeft > 0 ? anim : null;
        if (!failure) {
          failureReason = anim.reason;
          failureSegmentIndex = anim.segmentIndex;
        }
      } else if (failure.kind === "loop_stall") {
        const anim = failure as LoopStallAnim;
        const step = tickLoopStall(anim, built, dist, velocity);
        dist = step.dist;
        velocity = step.velocity;
        pos = step.pos;
        quat = step.quat;
        speed = velocity;
        airborne = false;
        failure = anim.ticksLeft > 0 ? anim : null;
        if (!failure) {
          failureReason = anim.reason;
          failureSegmentIndex = anim.segmentIndex;
        }
      } else {
        const anim = failure as JumpBailAnim;
        const step = tickJumpBail(anim);
        pos = step.pos;
        quat = step.quat;
        airborne = step.airborne;
        speed = Math.hypot(anim.vel[0], anim.vel[2]);
        failure = anim.ticksLeft > 0 ? anim : null;
        if (!failure) {
          failureReason = anim.reason;
          failureSegmentIndex = anim.segmentIndex;
        }
      }

      physics.step(pos, quat);
      const read = physics.read();
      wheelSpin += ((speed * DIST_SCALE) / WHEEL_RADIUS) * SIM_DT;

      tick++;
      const t = tick * SIM_DT;
      if (tick % FRAME_INTERVAL === 0) {
        record(t, read.pos, read.quat, speed, 0, false, airborne, segIdx);
      }

      if (!failure && failureReason) break;
      continue;
    }

    if (!entered.has(segIndex)) {
      entered.add(segIndex);
      const check = checkSegmentEntry(seg, effective, velocity);
      if (!check.ok) {
        failureReason = check.reason;
        failureSegmentIndex = segIndex;
        break;
      }
      if (seg.type === "jump") {
        const off = shouldFlyOffJump(seg, effective, velocity);
        if (off.fly) {
          failure = startJumpBail(
            built,
            dist,
            velocity,
            segIndex,
            off.reason!,
          );
          continue;
        }
      }
      if (seg.type === "loop") {
        const off = shouldFlyOffLoop(seg, effective, velocity, {
          progress: 0,
          climbWorldUp: 1,
        });
        if (off.fly) {
          failure = startLoopStall(seg, meta, segIndex, off.reason!);
          continue;
        }
      }
      if (seg.type === "curve") {
        const off = shouldFlyOffCurve(seg, effective, velocity);
        if (off.fly) {
          failure = startCurveOffTrack(
            velocity,
            seg,
            segIndex,
            off.reason!,
            effective,
            lateralSignForSegment(seg),
          );
          continue;
        }
      }
    }

    const node = nodeAtDist(built.nodes, dist);
    const airborne = !node.solid;
    let boosting = false;

    switch (seg.type) {
      case "straight": {
        const paceCap = maxSpeed(effective) * speedTrackPaceMult(effective);
        velocity = Math.min(
          paceCap,
          velocity + accelRate(effective) * SIM_DT,
        );
        const nextSeg = track.segments[segIndex + 1];
        if (nextSeg?.type === "curve") {
          velocity = brakeTowardCurveLimit(velocity, effective, nextSeg);
        }
        break;
      }
      case "curve": {
        const maxV = maxCurveSpeedForSegment(effective, seg);
        if (velocity > maxV) {
          velocity -= effective.handling * CURVE_BRAKE * SIM_DT;
        }
        velocity = Math.min(
          maxV,
          Math.max(velocity, 0) + accelRate(effective) * SIM_DT * 0.25,
        );
        break;
      }
      case "booster":
      case "rocket": {
        if (!boostApplied.has(segIndex)) {
          velocity = applyPadBoost(
            velocity,
            effective,
            seg.boostMultiplier,
            seg.type,
          );
          boostApplied.add(segIndex);
        }
        velocity = Math.min(
          velocity,
          boostCap(effective, seg.boostMultiplier, seg.type),
        );
        boosting = true;
        break;
      }
      case "loop":
        velocity = Math.max(velocity, maxSpeed(effective) * 0.6);
        break;
      case "jump":
        if (!airborne) {
          velocity = Math.min(
            maxSpeed(effective),
            velocity + accelRate(effective) * SIM_DT,
          );
        } else {
          velocity = Math.min(velocity, maxSpeed(effective) * 1.2);
        }
        break;
    }

    if (airborne && seg.type !== "jump") {
      velocity = Math.min(velocity, maxSpeed(effective) * 1.15);
    }

    if (seg.type === "curve") {
      const off = shouldFlyOffCurve(seg, effective, velocity);
      if (off.fly) {
        failure = startCurveOffTrack(
          velocity,
          seg,
          segIndex,
          off.reason!,
          effective,
          lateralSignForSegment(seg),
        );
        continue;
      }
    }

    if (seg.type === "loop") {
      const loopProgress =
        (dist - meta.startDist) / Math.max(meta.endDist - meta.startDist, 1);
      const off = shouldFlyOffLoop(seg, effective, velocity, {
        progress: loopProgress,
        climbWorldUp: node.up[1],
      });
      if (off.fly) {
        failure = startLoopStall(seg, meta, segIndex, off.reason!);
        continue;
      }
    }

    if (seg.type === "rocket") {
      const off = shouldFlyOffRocket(seg, effective, velocity);
      if (off.fly) {
        failure = startCurveOffTrack(
          velocity,
          {
            type: "curve",
            radius: 40,
            angle: 45,
          },
          segIndex,
          off.reason!,
          effective,
          1,
        );
        continue;
      }
    }

    dist += velocity * DIST_SCALE * SIM_DT;
    wheelSpin += ((velocity * DIST_SCALE) / WHEEL_RADIUS) * SIM_DT;

    const simTime = tick * SIM_DT;
    if (!success && simTime > timeLimitSec) {
      failureReason = "Tijd op — rij sneller!";
      failureSegmentIndex = segIndex;
      break;
    }

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
    timeLimitSec,
  };
}
