import { useEffect, useRef } from "react";
import type { RaceKeyframe } from "./types";
import type { TrackSegment } from "../config/schemas";

interface Props {
  keyframes: RaceKeyframe[];
  segments: TrackSegment[];
  success: boolean;
  playing: boolean;
  onComplete?: () => void;
}

export function RaceCanvas({
  keyframes,
  segments,
  success,
  playing,
  onComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

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

    const drawTrack = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#ff6b00";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(20, h * 0.7);
      let tx = 20;
      for (const seg of segments) {
        const len =
          seg.type === "straight" ? seg.length : seg.type === "curve" ? 60 : 40;
        tx += (len / maxX) * (w - 60);
        if (seg.type === "loop") {
          ctx.arc(tx - 20, h * 0.5, 25, 0, Math.PI * 2);
        } else if (seg.type === "jump") {
          ctx.lineTo(tx, h * 0.4);
          ctx.lineTo(tx + 20, h * 0.7);
        } else {
          ctx.lineTo(tx, h * 0.7);
        }
      }
      ctx.stroke();

      if (success) {
        ctx.fillStyle = "#00c853";
        ctx.fillRect(w - 30, h * 0.55, 8, 40);
        ctx.fillStyle = "#fff";
        ctx.fillRect(w - 38, h * 0.55, 20, 12);
      }
    };

    const interval = setInterval(() => {
      const idx = Math.min(frameRef.current, keyframes.length - 1);
      const kf = keyframes[idx]!;
      drawTrack();

      const px = 20 + (kf.x / maxX) * (w - 60);
      const py = h * 0.7 + kf.y;

      ctx.fillStyle = "#ff2d00";
      ctx.fillRect(px - 12, py - 8, 24, 12);
      ctx.fillStyle = "#ffd100";
      ctx.fillRect(px - 8, py - 6, 16, 6);

      frameRef.current++;
      if (frameRef.current >= keyframes.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 33);

    return () => clearInterval(interval);
  }, [keyframes, segments, success, playing, onComplete]);

  return (
    <div className="race-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
