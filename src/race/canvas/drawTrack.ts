import type { TrackSegment } from "../../config/schemas";
import { COLORS } from "./colors";

interface TrackLayout {
  points: { x: number; y: number }[];
  segmentEnds: number[];
}

export function buildTrackLayout(
  segments: TrackSegment[],
  w: number,
  h: number,
): TrackLayout {
  const baseY = h * 0.72;
  const points: { x: number; y: number }[] = [{ x: 20, y: baseY }];
  const segmentEnds: number[] = [];
  let x = 20;

  const totalLen = segments.reduce((sum, seg) => {
    if (seg.type === "straight") return sum + seg.length;
    if (seg.type === "curve") return sum + 60;
    return sum + 40;
  }, 0);

  const scale = (w - 80) / totalLen;

  for (const seg of segments) {
    if (seg.type === "straight") {
      x += seg.length * scale;
      points.push({ x, y: baseY });
    } else if (seg.type === "curve") {
      const cx = x + 30 * scale;
      const cy = baseY - 25;
      for (let a = 0; a <= Math.PI / 2; a += Math.PI / 16) {
        points.push({
          x: cx + Math.cos(a + Math.PI) * 25 * scale,
          y: cy + Math.sin(a + Math.PI) * 25 * scale,
        });
      }
      x += 60 * scale;
      points.push({ x, y: baseY });
    } else if (seg.type === "loop") {
      const cx = x + 20 * scale;
      const loopR = 30 * scale;
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 12) {
        points.push({
          x: cx + Math.cos(a) * loopR,
          y: baseY - loopR + Math.sin(a) * loopR,
        });
      }
      x += 40 * scale;
      points.push({ x, y: baseY });
    } else if (seg.type === "jump") {
      x += 15 * scale;
      points.push({ x, y: baseY - 35 });
      x += 25 * scale;
      points.push({ x, y: baseY });
    } else {
      x += 40 * scale;
      points.push({ x, y: baseY });
    }
    segmentEnds.push(points.length - 1);
  }

  return { points, segmentEnds };
}

function drawTrackSegment(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  startIdx: number,
  endIdx: number,
  type: string,
) {
  if (endIdx <= startIdx) return;

  const isBooster = type === "booster";
  const isRocket = type === "rocket";

  ctx.beginPath();
  ctx.moveTo(points[startIdx]!.x, points[startIdx]!.y);
  for (let i = startIdx + 1; i <= endIdx; i++) {
    ctx.lineTo(points[i]!.x, points[i]!.y);
  }

  ctx.strokeStyle =
    isBooster || isRocket ? COLORS.boosterBlue : COLORS.trackOrange;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.strokeStyle =
    isBooster || isRocket ? COLORS.boosterLight : COLORS.trackHighlight;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (isBooster || isRocket) {
    const mid = Math.floor((startIdx + endIdx) / 2);
    const p = points[mid]!;
    ctx.fillStyle = COLORS.yellow;
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(p.x - 4 + i * 12, p.y - 8, 6, 4);
    }
  }
}

export function drawTrack(
  ctx: CanvasRenderingContext2D,
  segments: TrackSegment[],
  layout: TrackLayout,
) {
  let prevEnd = 0;
  for (let i = 0; i < segments.length; i++) {
    const endIdx = layout.segmentEnds[i]!;
    drawTrackSegment(ctx, layout.points, prevEnd, endIdx, segments[i]!.type);
    prevEnd = endIdx;
  }

  for (const p of layout.points) {
    ctx.fillStyle = COLORS.trackShadow;
    ctx.fillRect(p.x - 5, p.y + 2, 10, 4);
  }
}

export function drawFinishGate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  success: boolean,
) {
  if (!success) return;
  const gx = w - 35;
  const gy = h * 0.45;

  ctx.fillStyle = "#333";
  ctx.fillRect(gx, gy, 6, h * 0.35);

  const fw = 28;
  const fh = 20;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.white : "#111";
      ctx.fillRect(
        gx + 6 + col * (fw / 4),
        gy + row * (fh / 4),
        fw / 4,
        fh / 4,
      );
    }
  }

  ctx.fillStyle = COLORS.finishGreen;
  ctx.font = "bold 10px Rajdhani, sans-serif";
  ctx.fillText("FINISH", gx - 5, gy - 5);
}
