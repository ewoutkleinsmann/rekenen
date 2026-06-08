import type { PathPoint } from "./trackBuilder";

/** Set each point's angle to the direction of travel along the path. */
export function computePathTangents(points: PathPoint[]): void {
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)]!;
    const next = points[Math.min(points.length - 1, i + 1)]!;
    points[i]!.angle = Math.atan2(next.y - prev.y, next.x - prev.x);
  }
}

/** Total arc length of the path in pixels. */
export function pathArcLength(points: PathPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

/** Point at distance `dist` (pixels) along the path. */
export function pointAtDist(points: PathPoint[], dist: number): PathPoint {
  if (points.length === 0) {
    return { x: 0, y: 0, angle: 0, segmentIndex: 0 };
  }
  if (dist <= 0) return { ...points[0]! };

  let accumulated = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (accumulated + segLen >= dist) {
      const t = segLen > 0 ? (dist - accumulated) / segLen : 0;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        segmentIndex: t < 0.5 ? a.segmentIndex : b.segmentIndex,
      };
    }
    accumulated += segLen;
  }
  return { ...points[points.length - 1]! };
}

export function getSegmentAtDist<
  T extends { index: number; startDist: number; endDist: number },
>(segments: T[], dist: number): T {
  for (const s of segments) {
    if (dist >= s.startDist && dist < s.endDist) return s;
  }
  return segments[segments.length - 1]!;
}
