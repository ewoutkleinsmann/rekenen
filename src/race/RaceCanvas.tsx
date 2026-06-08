import { useEffect, useRef } from "react";
import type { RaceKeyframe } from "./types";
import type { TrackSegment } from "../config/schemas";
import { drawSky } from "./canvas/drawSky";
import {
  buildTrackLayout,
  drawTrack,
  drawFinishGate,
} from "./canvas/drawTrack";
import { drawCar } from "./canvas/drawCar";

interface Props {
  keyframes: RaceKeyframe[];
  segments: TrackSegment[];
  success: boolean;
  playing: boolean;
  carId?: string;
  onComplete?: () => void;
}

export function RaceCanvas({
  keyframes,
  segments,
  success,
  playing,
  carId = "booster-blaze",
  onComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const layoutRef = useRef<ReturnType<typeof buildTrackLayout> | null>(null);

  useEffect(() => {
    if (!playing || keyframes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    frameRef.current = 0;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const maxX = Math.max(...keyframes.map((k) => k.x), 200);
    const layout = buildTrackLayout(segments, w, h);
    layoutRef.current = layout;

    const render = () => {
      drawSky(ctx, w, h);
      drawTrack(ctx, segments, layout);
      drawFinishGate(ctx, w, h, success);

      const idx = Math.min(frameRef.current, keyframes.length - 1);
      const kf = keyframes[idx]!;
      const px = 20 + (kf.x / maxX) * (w - 60);
      const py = h * 0.72 + kf.y;

      drawCar(ctx, px, py - 8, kf.velocity, carId);
    };

    render();

    const interval = setInterval(() => {
      render();
      frameRef.current++;
      if (frameRef.current >= keyframes.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 33);

    return () => clearInterval(interval);
  }, [keyframes, segments, success, playing, carId, onComplete]);

  return (
    <div className="race-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
