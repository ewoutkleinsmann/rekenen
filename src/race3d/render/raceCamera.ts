import * as THREE from "three";
import type { Track3D } from "../sim/buildTrack3d";
import type { SampledState } from "./sampleReplay";

export interface TrackOverview {
  center: THREE.Vector3;
  radius: number;
  eyeHeight: number;
}

export function computeTrackOverview(track: Track3D): TrackOverview {
  const b = track.bounds;
  const cx = (b.min[0] + b.max[0]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;
  const center = new THREE.Vector3(cx, b.min[1] + 2, cz);
  let radius = 40;
  for (const n of track.nodes) {
    radius = Math.max(
      radius,
      Math.hypot(n.pos[0] - cx, n.pos[2] - cz),
    );
  }
  return {
    center,
    radius: radius * 1.15 + 24,
    eyeHeight: Math.max(72, radius * 0.95 + 48),
  };
}

export type CinematicMode = "chase" | "wide" | "side" | "helicopter";

const BEATS: { at: number; mode: CinematicMode }[] = [
  { at: 0.18, mode: "wide" },
  { at: 0.48, mode: "side" },
  { at: 0.78, mode: "helicopter" },
];

export class CinematicDirector {
  private fired = new Set<number>();
  private activeUntil = 0;
  private mode: CinematicMode = "chase";

  reset() {
    this.fired.clear();
    this.activeUntil = 0;
    this.mode = "chase";
  }

  update(raceProgress: number, nowMs: number): CinematicMode {
    if (nowMs < this.activeUntil) return this.mode;

    this.mode = "chase";
    for (const beat of BEATS) {
      if (raceProgress >= beat.at && !this.fired.has(beat.at)) {
        this.fired.add(beat.at);
        this.mode = beat.mode;
        this.activeUntil = nowMs + 2_800;
        break;
      }
    }

    return this.mode;
  }
}

const _localOffset = new THREE.Vector3();

/** Desired camera position and look-at for the current shot. */
export function sampleCameraTarget(
  mode: CinematicMode,
  car: SampledState,
  overview: TrackOverview,
  introT: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): void {
  if (introT < 1) {
    const ease = introT * introT * (3 - 2 * introT);
    const angle = ease * Math.PI * 1.25 + 0.4;
    const r = overview.radius * (0.5 + ease * 0.15);
    const y = overview.eyeHeight + 14;
    outPos.set(
      overview.center.x + Math.cos(angle) * r,
      y,
      overview.center.z + Math.sin(angle) * r,
    );
    outLook.copy(overview.center);
    outLook.y += 1.5;
    return;
  }

  const up = new THREE.Vector3(0, 1, 0);

  switch (mode) {
    case "wide":
      _localOffset.set(0, 7.8, 19);
      break;
    case "side":
      _localOffset.set(7.5, 3.8, 5);
      break;
    case "helicopter":
      outPos.copy(car.pos).add(new THREE.Vector3(0, 44, 5));
      outLook.copy(car.pos);
      outLook.y += 0.8;
      return;
    case "chase":
    default:
      _localOffset.set(0, 4.4, 11.5);
      break;
  }

  _localOffset.applyQuaternion(car.quat);
  outPos.copy(car.pos).add(_localOffset);
  outLook.copy(car.pos).addScaledVector(up, 1.35);
}

export function targetFov(
  mode: CinematicMode,
  speed: number,
  boosting: boolean,
): number {
  let fov = 55;
  if (mode === "wide") fov = 62;
  if (mode === "helicopter") fov = 58;
  if (mode === "side") fov = 52;
  fov += Math.min(16, speed * 0.1);
  if (boosting) fov += 5;
  return fov;
}
