import type { TrackSegment } from "../../config/schemas";
import { buildTrack, type TrackBuildResult } from "../physics/trackBuilder";
import { TRACK_THICKNESS, TRACK_Y } from "../physics/constants";

const COLORS = {
  trackOrange: "#FF6B00",
  trackHighlight: "#FF8C33",
  trackShadow: "#CC5500",
  rail: "#FFE600",
  kerbW: "#FFFFFF",
  kerbB: "#111111",
  boosterBlue: "#0072CE",
  boosterGlow: "#009CDE",
  finishGreen: "#22C55E",
};

let layoutCache: TrackBuildResult | null = null;
let layoutKey = "";

export function getTrackLayout(segments: TrackSegment[]): TrackBuildResult {
  const key = JSON.stringify(segments);
  if (layoutCache && layoutKey === key) return layoutCache;
  layoutCache = buildTrack(segments);
  layoutKey = key;
  return layoutCache;
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawKerbs(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.floor(len / 8);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    ctx.fillStyle = i % 2 === 0 ? COLORS.kerbW : COLORS.kerbB;
    ctx.fillRect(x - 4, y - 14, 8, 6);
  }
}

export function drawTrack(
  ctx: CanvasRenderingContext2D,
  segments: TrackSegment[],
  time: number,
) {
  const layout = getTrackLayout(segments);
  const pts = layout.pathPoints;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const meta = layout.segments[a.segmentIndex];
    const isBoost = meta?.type === "booster" || meta?.type === "rocket";

    ctx.strokeStyle = COLORS.trackShadow;
    ctx.lineWidth = TRACK_THICKNESS + 8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 8);
    ctx.lineTo(b.x, b.y + 8);
    ctx.stroke();

    ctx.strokeStyle = isBoost ? COLORS.boosterBlue : COLORS.trackOrange;
    ctx.lineWidth = TRACK_THICKNESS;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = isBoost ? COLORS.boosterGlow : COLORS.trackHighlight;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 2);
    ctx.lineTo(b.x, b.y - 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    drawRail(ctx, a.x, a.y - 10, b.x, b.y - 10, COLORS.rail);
    drawRail(ctx, a.x, a.y + 10, b.x, b.y + 10, COLORS.rail);

    if (meta?.type === "curve") {
      drawKerbs(ctx, a.x, a.y - 16, b.x, b.y - 16);
    }

    if (isBoost) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const pulse = 0.5 + Math.sin(time * 0.008 + mx * 0.01) * 0.5;
      ctx.fillStyle = `rgba(255, 230, 0, ${0.3 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(mx, my, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFinishGate(ctx, layout.finishX, TRACK_Y);
}

function drawFinishGate(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  ctx.fillStyle = "#333";
  ctx.fillRect(gx, gy - 120, 8, 120);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#fff" : "#111";
      ctx.fillRect(gx + 8 + col * 7, gy - 110 + row * 7, 7, 7);
    }
  }

  ctx.fillStyle = COLORS.finishGreen;
  ctx.font = "bold 14px Rajdhani, sans-serif";
  ctx.fillText("FINISH", gx - 4, gy - 125);
}

export function getTrackBounds(segments: TrackSegment[]) {
  return getTrackLayout(segments).bounds;
}
