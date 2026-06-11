import type { TrackSegment } from "../../config/schemas";
import type { EffectiveStats } from "../../garage/stats";
import type { SegmentMeta3D, Track3D } from "./buildTrack3d";
import { nodeAtDist } from "./buildTrack3d";
import { loopMinEntrySpeed } from "./segmentPhysics";
import { curveSharpness, maxCurveSpeedForSegment } from "./segmentRules";
import { CAR_RIDE_HEIGHT, DIST_SCALE, SIM_DT } from "./simConstants";
import {
  add,
  cross,
  normalize,
  quatFromFrame,
  rotateAround,
  scale,
  type Quat,
  type Vec3,
} from "./vec3";

export type FailureAnimKind = "curve_offtrack" | "loop_stall" | "jump_bail";

export interface FailureAnim {
  kind: FailureAnimKind;
  ticksLeft: number;
  reason: string;
  segmentIndex: number;
}

export interface CurveOffTrackAnim extends FailureAnim {
  kind: "curve_offtrack";
  lateral: number;
  lateralVel: number;
  alongVel: number;
  yaw: number;
  lipLift: number;
}

export interface LoopStallAnim extends FailureAnim {
  kind: "loop_stall";
  rollback: boolean;
  segStart: number;
  segEnd: number;
  minEntrySpeed: number;
}

export interface JumpBailAnim extends FailureAnim {
  kind: "jump_bail";
  pos: Vec3;
  vel: Vec3;
  quat: Quat;
  grounded: boolean;
}

function bankedUp(forward: Vec3, up: Vec3, banking: number): Vec3 {
  if (Math.abs(banking) < 1e-4) return up;
  return normalize(rotateAround(up, forward, banking));
}

export function poseOffTrack(
  track: Track3D,
  dist: number,
  lateral: number,
  yawExtra: number,
  lipLift: number,
): { pos: Vec3; quat: Quat } {
  const node = nodeAtDist(track.nodes, dist);
  const up = bankedUp(node.forward, node.up, node.banking);
  const right = normalize(cross(up, node.forward));
  const base = add(node.pos, scale(up, CAR_RIDE_HEIGHT));
  const lift = Math.max(0, Math.min(lipLift, 1.4));
  const pos = add(add(base, scale(right, lateral)), scale(up, lift));
  const yawedForward = normalize(rotateAround(node.forward, up, yawExtra));
  return { pos, quat: quatFromFrame(yawedForward, up) };
}

export function startCurveOffTrack(
  velocity: number,
  segment: TrackSegment & { type: "curve" },
  segmentIndex: number,
  reason: string,
  stats: EffectiveStats,
  lateralSign: number,
): CurveOffTrackAnim {
  const maxV = maxCurveSpeedForSegment(stats, segment);
  const excess = Math.max(0, velocity - maxV);
  const sharp = curveSharpness(segment);
  const speedFactor = velocity / Math.max(maxV, 1);
  const lateralVel =
    lateralSign *
    (2.2 + excess * 0.14 + speedFactor * 1.8) *
    Math.max(0.9, sharp);
  return {
    kind: "curve_offtrack",
    ticksLeft: 110,
    reason,
    segmentIndex,
    lateral: 0,
    lateralVel,
    alongVel: velocity * 0.45,
    yaw: 0,
    lipLift: 0.12 + Math.min(excess * 0.01, 0.35),
  };
}

export function tickCurveOffTrack(
  anim: CurveOffTrackAnim,
  track: Track3D,
  dist: number,
): { dist: number; pos: Vec3; quat: Quat; airborne: boolean } {
  anim.lateral += anim.lateralVel * SIM_DT;
  anim.alongVel *= 0.985;
  anim.lateralVel *= 0.998;
  anim.yaw += anim.lateralVel * 0.06 * SIM_DT;
  if (anim.lipLift > 0) {
    anim.lipLift = Math.max(0, anim.lipLift - 0.35 * SIM_DT);
  }
  const newDist = dist + anim.alongVel * DIST_SCALE * SIM_DT;
  const { pos, quat } = poseOffTrack(
    track,
    newDist,
    anim.lateral,
    anim.yaw,
    anim.lipLift,
  );
  anim.ticksLeft -= 1;
  return {
    dist: newDist,
    pos,
    quat,
    airborne: Math.abs(anim.lateral) > 2.5,
  };
}

export function startLoopStall(
  segment: TrackSegment & { type: "loop" },
  meta: SegmentMeta3D,
  segmentIndex: number,
  reason: string,
): LoopStallAnim {
  return {
    kind: "loop_stall",
    ticksLeft: 150,
    reason,
    segmentIndex,
    rollback: false,
    segStart: meta.startDist,
    segEnd: meta.endDist,
    minEntrySpeed: loopMinEntrySpeed(segment.radius),
  };
}

export function tickLoopStall(
  anim: LoopStallAnim,
  track: Track3D,
  dist: number,
  velocity: number,
): { dist: number; velocity: number; pos: Vec3; quat: Quat } {
  const node = nodeAtDist(track.nodes, dist);
  const progress =
    (dist - anim.segStart) / Math.max(anim.segEnd - anim.segStart, 1);
  const climb = node.up[1];
  let newDist = dist;
  let newVel = velocity;

  if (!anim.rollback) {
    newVel *= 0.9;
    const pastCrest = progress > 0.38 && climb < 0.35;
    const tooSlow =
      newVel < anim.minEntrySpeed * 0.72 &&
      (progress > 0.22 || climb < 0.55);
    if (pastCrest || tooSlow) {
      anim.rollback = true;
      newVel = 0;
    } else {
      newDist += newVel * DIST_SCALE * SIM_DT;
      newDist = Math.min(newDist, anim.segEnd - 0.5);
    }
  } else {
    const rollBack = 42;
    newDist -= rollBack * DIST_SCALE * SIM_DT;
    newDist = Math.max(anim.segStart, newDist);
    newVel = 0;
  }

  const poseNode = nodeAtDist(track.nodes, newDist);
  const up = bankedUp(poseNode.forward, poseNode.up, poseNode.banking);
  const pos = add(poseNode.pos, scale(up, CAR_RIDE_HEIGHT));
  const quat = quatFromFrame(poseNode.forward, up);
  anim.ticksLeft -= 1;
  return { dist: newDist, velocity: newVel, pos, quat };
}

export function startJumpBail(
  track: Track3D,
  dist: number,
  velocity: number,
  segmentIndex: number,
  reason: string,
): JumpBailAnim {
  const node = nodeAtDist(track.nodes, dist);
  const up = bankedUp(node.forward, node.up, node.banking);
  const pos = add(node.pos, scale(up, CAR_RIDE_HEIGHT));
  const quat = quatFromFrame(node.forward, up);
  const horiz = normalize([node.forward[0], 0, node.forward[2]]);
  return {
    kind: "jump_bail",
    ticksLeft: 120,
    reason,
    segmentIndex,
    pos: [...pos],
    vel: [
      horiz[0] * velocity * 0.35,
      velocity * 0.08,
      horiz[2] * velocity * 0.35,
    ],
    quat,
    grounded: false,
  };
}

export function tickJumpBail(anim: JumpBailAnim): {
  pos: Vec3;
  quat: Quat;
  airborne: boolean;
} {
  anim.vel[1] -= 12 * SIM_DT;
  anim.pos[0] += anim.vel[0] * DIST_SCALE * SIM_DT;
  anim.pos[1] += anim.vel[1] * DIST_SCALE * SIM_DT;
  anim.pos[2] += anim.vel[2] * DIST_SCALE * SIM_DT;
  if (anim.pos[1] < 0.35) {
    anim.pos[1] = 0.35;
    anim.vel[1] = 0;
    anim.grounded = true;
    anim.vel[0] *= 0.9;
    anim.vel[2] *= 0.9;
  }
  anim.ticksLeft -= 1;
  return { pos: anim.pos, quat: anim.quat, airborne: !anim.grounded };
}
