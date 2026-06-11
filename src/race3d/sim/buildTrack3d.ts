import type { TrackConfig, TrackSegment } from "../../config/schemas";
import {
  add,
  cross,
  normalize,
  quatFromFrame,
  rotateAround,
  scale,
  sub,
  type Quat,
  type Vec3,
} from "./vec3";

/** A point on the track centerline with a full orientation frame. */
export interface CenterlineNode {
  pos: Vec3;
  /** Unit tangent (driving direction). */
  forward: Vec3;
  /** Unit up vector of the road surface at this point. */
  up: Vec3;
  /** Arc-length distance from the start. */
  dist: number;
  segmentIndex: number;
  /** Whether there is solid road here (false inside a jump gap). */
  solid: boolean;
  /** Visual banking roll in radians applied on curves. */
  banking: number;
}

export interface SegmentMeta3D {
  index: number;
  type: TrackSegment["type"];
  startDist: number;
  endDist: number;
  segment: TrackSegment;
}

/** Oriented box collider description for the headless physics world. */
export interface ColliderSpec {
  center: Vec3;
  halfExtents: Vec3;
  quat: Quat;
}

export interface Track3D {
  nodes: CenterlineNode[];
  segments: SegmentMeta3D[];
  colliders: ColliderSpec[];
  totalLength: number;
  roadWidth: number;
  roadThickness: number;
  startPos: Vec3;
  startForward: Vec3;
  startUp: Vec3;
  finishDist: number;
  bounds: { min: Vec3; max: Vec3 };
}

export const ROAD_WIDTH = 10;
export const ROAD_THICKNESS = 0.8;
/** Centerline sampling resolution in world units. */
const STEP = 2.5;
/** Length (world units) used to render booster / rocket pads. */
const PAD_LENGTH = 55;

function pushNode(
  nodes: CenterlineNode[],
  pos: Vec3,
  forward: Vec3,
  up: Vec3,
  dist: number,
  segmentIndex: number,
  solid: boolean,
  banking: number,
) {
  nodes.push({
    pos,
    forward: normalize(forward),
    up: normalize(up),
    dist,
    segmentIndex,
    solid,
    banking,
  });
}

export function buildTrack3d(track: TrackConfig): Track3D {
  const segments = track.segments;
  const nodes: CenterlineNode[] = [];
  const segMetas: SegmentMeta3D[] = [];

  let pos: Vec3 = [0, 0, 0];
  let forward: Vec3 = [0, 0, 1];
  let up: Vec3 = [0, 1, 0];
  let dist = 0;
  let curveCount = 0;

  const startPos = pos;
  const startForward = forward;
  const startUp = up;

  pushNode(nodes, pos, forward, up, dist, 0, true, 0);

  const advanceStraight = (
    len: number,
    segmentIndex: number,
    solid: boolean,
  ) => {
    const steps = Math.max(1, Math.round(len / STEP));
    const stepLen = len / steps;
    for (let i = 0; i < steps; i++) {
      pos = add(pos, scale(forward, stepLen));
      dist += stepLen;
      pushNode(nodes, pos, forward, up, dist, segmentIndex, solid, 0);
    }
  };

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si]!;
    const startDist = dist;

    switch (seg.type) {
      case "straight": {
        advanceStraight(seg.length, si, true);
        break;
      }

      case "booster":
      case "rocket": {
        advanceStraight(PAD_LENGTH, si, true);
        break;
      }

      case "curve": {
        const dir =
          seg.direction ?? (curveCount % 2 === 0 ? "right" : "left");
        curveCount++;
        const sign = dir === "right" ? 1 : -1;
        const totalAngle = (seg.angle * Math.PI) / 180;
        const radius = seg.radius;
        const arcLen = totalAngle * radius;
        const steps = Math.max(4, Math.round(arcLen / STEP));
        const banking = Math.min(0.35, totalAngle / 6) * sign;
        for (let i = 0; i < steps; i++) {
          const dAngle = (totalAngle / steps) * sign;
          // Pivot point is to the side of the car at `radius`.
          const right = normalize(cross(up, forward));
          const center = add(pos, scale(right, sign * radius));
          // Rotate position around the vertical axis at the pivot.
          const rel = sub(pos, center);
          const rotated = rotateAround(rel, up, dAngle);
          pos = add(center, rotated);
          forward = normalize(rotateAround(forward, up, dAngle));
          dist += arcLen / steps;
          pushNode(nodes, pos, forward, up, dist, si, true, banking);
        }
        break;
      }

      case "loop": {
        const radius = seg.radius;
        const loopLen = 2 * Math.PI * radius;
        const steps = Math.max(24, Math.round(loopLen / STEP));
        const right = normalize(cross(up, forward));
        for (let i = 0; i < steps; i++) {
          const dAngle = -(2 * Math.PI) / steps; // pitch up and over
          const center = add(pos, scale(up, radius));
          const rel = sub(pos, center);
          const rotated = rotateAround(rel, right, dAngle);
          pos = add(center, rotated);
          forward = normalize(rotateAround(forward, right, dAngle));
          up = normalize(rotateAround(up, right, dAngle));
          dist += loopLen / steps;
          pushNode(nodes, pos, forward, up, dist, si, true, 0);
        }
        break;
      }

      case "jump": {
        // Approach ramp (up) -> airborne gap (no road) -> landing ramp (down).
        const total = seg.length;
        const rampLen = total * 0.35;
        const gapLen = total * 0.9;
        const rampAngle = 0.42; // ~24 degrees
        const right = normalize(cross(up, forward));

        // Up ramp.
        const upSteps = Math.max(3, Math.round(rampLen / STEP));
        for (let i = 0; i < upSteps; i++) {
          forward = normalize(rotateAround(forward, right, -rampAngle / upSteps));
          up = normalize(rotateAround(up, right, -rampAngle / upSteps));
          pos = add(pos, scale(forward, rampLen / upSteps));
          dist += rampLen / upSteps;
          pushNode(nodes, pos, forward, up, dist, si, true, 0);
        }

        // Airborne ballistic gap: rise to a peak then come back to ground level.
        const launchForward = forward;
        const gapSteps = Math.max(6, Math.round(gapLen / STEP));
        const horiz: Vec3 = normalize([launchForward[0], 0, launchForward[2]]);
        const peak = total * 0.5;
        for (let i = 1; i <= gapSteps; i++) {
          const t = i / gapSteps;
          const along = scale(horiz, gapLen * t);
          const y = 4 * peak * t * (1 - t); // parabola, 0 at ends
          const gapPos: Vec3 = [
            pos[0] + along[0],
            pos[1] + y,
            pos[2] + along[2],
          ];
          // Tangent of the parabola for orientation.
          const dy = 4 * peak * (1 - 2 * t);
          const tangent = normalize([horiz[0], dy / gapLen, horiz[2]]);
          dist += gapLen / gapSteps;
          pushNode(nodes, gapPos, tangent, [0, 1, 0], dist, si, false, 0);
        }
        const lastGap = nodes[nodes.length - 1]!;
        pos = lastGap.pos;
        forward = horiz;
        up = [0, 1, 0];

        // Landing strip.
        advanceStraight(rampLen, si, true);
        break;
      }
    }

    segMetas.push({
      index: si,
      type: seg.type,
      startDist,
      endDist: dist,
      segment: seg,
    });
  }

  // Final finish runway so the car has room to roll out.
  advanceStraight(20, segments.length - 1, true);

  const totalLength = dist;
  const finishDist = segMetas[segMetas.length - 1]?.endDist ?? totalLength;

  const colliders = buildColliders(nodes);
  const bounds = computeBounds(nodes);

  return {
    nodes,
    segments: segMetas,
    colliders,
    totalLength,
    roadWidth: ROAD_WIDTH,
    roadThickness: ROAD_THICKNESS,
    startPos,
    startForward,
    startUp,
    finishDist,
    bounds,
  };
}

function buildColliders(nodes: CenterlineNode[]): ColliderSpec[] {
  const colliders: ColliderSpec[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    if (!a.solid || !b.solid) continue;
    const seg = sub(b.pos, a.pos);
    const segLen = Math.hypot(seg[0], seg[1], seg[2]);
    if (segLen < 1e-4) continue;
    const forward = normalize(seg);
    const up = a.up;
    const mid: Vec3 = [
      (a.pos[0] + b.pos[0]) / 2,
      (a.pos[1] + b.pos[1]) / 2,
      (a.pos[2] + b.pos[2]) / 2,
    ];
    // Drop the slab so its top surface sits at the centerline.
    const center = add(mid, scale(up, -ROAD_THICKNESS / 2));
    colliders.push({
      center,
      halfExtents: [ROAD_WIDTH / 2, ROAD_THICKNESS / 2, segLen / 2 + 0.05],
      quat: quatFromFrame(forward, up),
    });
  }
  return colliders;
}

function computeBounds(nodes: CenterlineNode[]): { min: Vec3; max: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const n of nodes) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], n.pos[k]);
      max[k] = Math.max(max[k], n.pos[k]);
    }
  }
  return { min, max };
}

/** Find the centerline node whose distance is nearest to `d`. */
export function nodeAtDist(nodes: CenterlineNode[], d: number): CenterlineNode {
  if (d <= 0) return nodes[0]!;
  const last = nodes[nodes.length - 1]!;
  if (d >= last.dist) return last;
  // Binary search.
  let lo = 0;
  let hi = nodes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nodes[mid]!.dist < d) lo = mid + 1;
    else hi = mid;
  }
  const hiNode = nodes[lo]!;
  const loNode = nodes[Math.max(0, lo - 1)]!;
  const span = hiNode.dist - loNode.dist;
  const t = span > 1e-6 ? (d - loNode.dist) / span : 0;
  return interpolateNode(loNode, hiNode, t);
}

function interpolateNode(
  a: CenterlineNode,
  b: CenterlineNode,
  t: number,
): CenterlineNode {
  return {
    pos: [
      a.pos[0] + (b.pos[0] - a.pos[0]) * t,
      a.pos[1] + (b.pos[1] - a.pos[1]) * t,
      a.pos[2] + (b.pos[2] - a.pos[2]) * t,
    ],
    forward: normalize([
      a.forward[0] + (b.forward[0] - a.forward[0]) * t,
      a.forward[1] + (b.forward[1] - a.forward[1]) * t,
      a.forward[2] + (b.forward[2] - a.forward[2]) * t,
    ]),
    up: normalize([
      a.up[0] + (b.up[0] - a.up[0]) * t,
      a.up[1] + (b.up[1] - a.up[1]) * t,
      a.up[2] + (b.up[2] - a.up[2]) * t,
    ]),
    dist: a.dist + (b.dist - a.dist) * t,
    segmentIndex: t < 0.5 ? a.segmentIndex : b.segmentIndex,
    solid: a.solid && b.solid,
    banking: a.banking + (b.banking - a.banking) * t,
  };
}

export function segmentMetaAtDist(
  segments: SegmentMeta3D[],
  d: number,
): SegmentMeta3D {
  for (const meta of segments) {
    if (d >= meta.startDist && d < meta.endDist) return meta;
  }
  return segments[segments.length - 1]!;
}
