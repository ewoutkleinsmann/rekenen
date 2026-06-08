import Matter from "matter-js";
import type { TrackSegment } from "../../config/schemas";
import {
  CURVE_STEPS,
  LENGTH_SCALE,
  LOOP_STEPS,
  TRACK_THICKNESS,
  TRACK_Y,
} from "./constants";
import { computePathTangents, pathArcLength } from "./pathUtils";

export interface PathPoint {
  x: number;
  y: number;
  angle: number;
  segmentIndex: number;
}

export interface SegmentMeta {
  index: number;
  type: TrackSegment["type"];
  startDist: number;
  endDist: number;
  segment: TrackSegment;
}

export interface TrackBuildResult {
  bodies: Matter.Body[];
  sensors: Matter.Body[];
  pathPoints: PathPoint[];
  segments: SegmentMeta[];
  totalLength: number;
  finishX: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

function addPlatform(
  bodies: Matter.Body[],
  cx: number,
  cy: number,
  width: number,
  height: number,
  angle = 0,
) {
  bodies.push(
    Matter.Bodies.rectangle(cx, cy, width, height, {
      isStatic: true,
      angle,
      friction: 0.8,
      label: "track",
    }),
  );
}

function sampleArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  steps: number,
  segmentIndex: number,
  points: PathPoint[],
) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + (endAngle - startAngle) * t;
    points.push({
      x: cx + Math.cos(a) * radius,
      y: cy + Math.sin(a) * radius,
      angle: 0,
      segmentIndex,
    });
  }
}

export function buildTrack(segments: TrackSegment[]): TrackBuildResult {
  const bodies: Matter.Body[] = [];
  const sensors: Matter.Body[] = [];
  const pathPoints: PathPoint[] = [];
  const segmentMetas: SegmentMeta[] = [];

  let x = 80;
  let y = TRACK_Y;
  let heading = 0;
  let totalDist = 0;

  pathPoints.push({ x, y: y - TRACK_THICKNESS / 2, angle: 0, segmentIndex: 0 });

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si]!;
    const startDist = totalDist;

    switch (seg.type) {
      case "straight": {
        const len = seg.length * LENGTH_SCALE;
        const cx = x + len / 2;
        addPlatform(bodies, cx, y, len, TRACK_THICKNESS);
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pathPoints.push({
            x: x + len * t,
            y: y - TRACK_THICKNESS / 2,
            angle: 0,
            segmentIndex: si,
          });
        }
        x += len;
        totalDist += len;
        break;
      }

      case "curve": {
        const arcLen =
          (seg.angle / 360) * 2 * Math.PI * seg.radius * LENGTH_SCALE;
        const r = seg.radius * (LENGTH_SCALE / 4);
        const cx = x + r;
        const cy = y - r;
        const startAngle = Math.PI / 2;
        const endAngle = Math.PI / 2 + (seg.angle * Math.PI) / 180;

        for (let i = 0; i < CURVE_STEPS; i++) {
          const a0 = startAngle + ((endAngle - startAngle) * i) / CURVE_STEPS;
          const a1 =
            startAngle + ((endAngle - startAngle) * (i + 1)) / CURVE_STEPS;
          const mx = (cx + Math.cos(a0) * r + cx + Math.cos(a1) * r) / 2;
          const my = (cy + Math.sin(a0) * r + cy + Math.sin(a1) * r) / 2;
          const segLen = Math.hypot(
            Math.cos(a1) * r - Math.cos(a0) * r,
            Math.sin(a1) * r - Math.sin(a0) * r,
          );
          addPlatform(
            bodies,
            mx,
            my,
            segLen + 4,
            TRACK_THICKNESS,
            (a0 + a1) / 2,
          );
        }

        sampleArc(cx, cy, r, startAngle, endAngle, CURVE_STEPS, si, pathPoints);
        const endPt = pathPoints[pathPoints.length - 1]!;
        x = endPt.x;
        y = endPt.y + TRACK_THICKNESS / 2;
        heading = endAngle;
        totalDist += arcLen;
        break;
      }

      case "booster":
      case "rocket": {
        const len = 60 * LENGTH_SCALE;
        const cx = x + len / 2;
        addPlatform(bodies, cx, y, len, TRACK_THICKNESS);
        sensors.push(
          Matter.Bodies.rectangle(cx, y - 30, len * 0.8, 40, {
            isStatic: true,
            isSensor: true,
            label: seg.type === "rocket" ? "rocket" : "booster",
          }),
        );
        for (let i = 0; i <= 6; i++) {
          pathPoints.push({
            x: x + (len * i) / 6,
            y: y - TRACK_THICKNESS / 2,
            angle: heading,
            segmentIndex: si,
          });
        }
        x += len;
        totalDist += len;
        break;
      }

      case "loop": {
        const r = seg.radius * (LENGTH_SCALE / 3);
        const cx = x + r;
        const cy = y - r;
        const loopLen = 2 * Math.PI * r;

        for (let i = 0; i < LOOP_STEPS; i++) {
          const a0 = Math.PI + (i / LOOP_STEPS) * Math.PI * 2;
          const a1 = Math.PI + ((i + 1) / LOOP_STEPS) * Math.PI * 2;
          const mx = (cx + Math.cos(a0) * r + cx + Math.cos(a1) * r) / 2;
          const my = (cy + Math.sin(a0) * r + cy + Math.sin(a1) * r) / 2;
          const segLen = Math.hypot(
            Math.cos(a1) * r - Math.cos(a0) * r,
            Math.sin(a1) * r - Math.sin(a0) * r,
          );
          addPlatform(
            bodies,
            mx,
            my,
            segLen + 4,
            TRACK_THICKNESS,
            (a0 + a1) / 2,
          );
        }

        for (let i = 0; i <= LOOP_STEPS; i++) {
          const a = Math.PI + (i / LOOP_STEPS) * Math.PI * 2;
          pathPoints.push({
            x: cx + Math.cos(a) * r,
            y: cy + Math.sin(a) * r,
            angle: 0,
            segmentIndex: si,
          });
        }

        const endPt = pathPoints[pathPoints.length - 1]!;
        x = endPt.x;
        y = endPt.y + TRACK_THICKNESS / 2;
        totalDist += loopLen;
        break;
      }

      case "jump": {
        const approach = seg.length * LENGTH_SCALE * 0.4;
        const gap = seg.length * LENGTH_SCALE * 0.35;
        const landing = seg.length * LENGTH_SCALE * 0.35;

        addPlatform(bodies, x + approach / 2, y, approach, TRACK_THICKNESS);
        for (let i = 0; i <= 4; i++) {
          pathPoints.push({
            x: x + (approach * i) / 4,
            y: y - TRACK_THICKNESS / 2,
            angle: 0,
            segmentIndex: si,
          });
        }
        x += approach;

        const gapMid = x + gap / 2;
        const peakY = y - 80 - seg.length;
        for (let i = 0; i <= 6; i++) {
          const t = i / 6;
          pathPoints.push({
            x: gapMid - gap / 2 + gap * t,
            y: peakY + Math.sin(t * Math.PI) * (y - peakY),
            angle: -Math.PI / 6 + (Math.PI / 3) * t,
            segmentIndex: si,
          });
        }
        x += gap;

        addPlatform(bodies, x + landing / 2, y, landing, TRACK_THICKNESS);
        for (let i = 0; i <= 4; i++) {
          pathPoints.push({
            x: x + (landing * i) / 4,
            y: y - TRACK_THICKNESS / 2,
            angle: 0,
            segmentIndex: si,
          });
        }
        x += landing;
        totalDist += approach + gap + landing;
        break;
      }
    }

    segmentMetas.push({
      index: si,
      type: seg.type,
      startDist: startDist,
      endDist: totalDist,
      segment: seg,
    });
  }

  const finishX = x;
  addPlatform(bodies, finishX + 40, TRACK_Y, 80, TRACK_THICKNESS);

  computePathTangents(pathPoints);
  const arcLength = pathArcLength(pathPoints);

  if (totalDist > 0) {
    const ratio = arcLength / totalDist;
    for (const meta of segmentMetas) {
      meta.startDist *= ratio;
      meta.endDist *= ratio;
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pathPoints) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return {
    bodies,
    sensors,
    pathPoints,
    segments: segmentMetas,
    totalLength: arcLength,
    finishX,
    bounds: { minX, maxX, minY, maxY },
  };
}

export { pointAtDist, getSegmentAtDist } from "./pathUtils";
