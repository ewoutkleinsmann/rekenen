import type { Quat, Vec3 } from "./vec3";

/** A single recorded moment of the car during the deterministic simulation. */
export interface ReplayFrame {
  /** Time in seconds since race start. */
  t: number;
  /** World position of the car chassis. */
  pos: Vec3;
  /** Orientation quaternion (x, y, z, w). */
  quat: Quat;
  /** Accumulated wheel spin angle in radians (for spinning the wheels). */
  wheelSpin: number;
  /** Front-wheel steer angle in radians (visual). */
  steer: number;
  /** Speed in game units/second (also drives camera FOV / fx). */
  speed: number;
  /** True while the car is on a booster/rocket pad. */
  boosting: boolean;
  /** True while the car is airborne (jump). */
  airborne: boolean;
  /** Index of the track segment the car is currently on. */
  segmentIndex: number;
}

export interface RaceReplay {
  frames: ReplayFrame[];
  /** Suggested playback duration in milliseconds. */
  durationMs: number;
  success: boolean;
  failureReason?: string;
  failureSegmentIndex?: number;
  /** Total simulated time in seconds. */
  totalTime: number;
  /** Par time in seconds (geometry-derived). */
  timeLimitSec?: number;
}
