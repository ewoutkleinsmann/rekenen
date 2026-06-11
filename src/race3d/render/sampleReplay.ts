import * as THREE from "three";
import type { RaceReplay, ReplayFrame } from "../sim/types";

export interface SampledState {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  wheelSpin: number;
  steer: number;
  speed: number;
  boosting: boolean;
  airborne: boolean;
  segmentIndex: number;
}

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();

function frameTime(replay: RaceReplay): number {
  return replay.totalTime > 0 ? replay.totalTime : 1;
}

/**
 * Samples the recorded replay at playback progress [0..1] and writes the
 * interpolated transform into `out`.
 */
export function sampleReplay(
  replay: RaceReplay,
  progress: number,
  out: SampledState,
): SampledState {
  const frames = replay.frames;
  if (frames.length === 0) {
    out.pos.set(0, 0, 0);
    out.quat.identity();
    out.wheelSpin = 0;
    out.steer = 0;
    out.speed = 0;
    out.boosting = false;
    out.airborne = false;
    out.segmentIndex = 0;
    return out;
  }

  const t = Math.max(0, Math.min(1, progress)) * frameTime(replay);

  // Binary search for the frame interval containing t.
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid]!.t < t) lo = mid + 1;
    else hi = mid;
  }
  const b: ReplayFrame = frames[lo]!;
  const a: ReplayFrame = frames[Math.max(0, lo - 1)]!;
  const span = b.t - a.t;
  const f = span > 1e-6 ? (t - a.t) / span : 0;

  out.pos.set(
    a.pos[0] + (b.pos[0] - a.pos[0]) * f,
    a.pos[1] + (b.pos[1] - a.pos[1]) * f,
    a.pos[2] + (b.pos[2] - a.pos[2]) * f,
  );
  _qa.set(a.quat[0], a.quat[1], a.quat[2], a.quat[3]);
  _qb.set(b.quat[0], b.quat[1], b.quat[2], b.quat[3]);
  out.quat.copy(_qa).slerp(_qb, f);
  out.wheelSpin = a.wheelSpin + (b.wheelSpin - a.wheelSpin) * f;
  out.steer = a.steer + (b.steer - a.steer) * f;
  out.speed = a.speed + (b.speed - a.speed) * f;
  out.boosting = f < 0.5 ? a.boosting : b.boosting;
  out.airborne = a.airborne || b.airborne;
  out.segmentIndex = f < 0.5 ? a.segmentIndex : b.segmentIndex;
  return out;
}

export function makeSampledState(): SampledState {
  return {
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    wheelSpin: 0,
    steer: 0,
    speed: 0,
    boosting: false,
    airborne: false,
    segmentIndex: 0,
  };
}
