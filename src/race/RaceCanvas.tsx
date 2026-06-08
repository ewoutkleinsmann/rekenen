import { useEffect, useRef, useState } from "react";
import type { RaceKeyframe } from "./types";
import type { TrackSegment } from "../config/schemas";
import { getPlaybackDurationMs } from "./simulation";
import { drawBackground } from "./render/drawBackground";
import { drawTrack, getTrackBounds } from "./render/drawTrack";
import { drawCar } from "./render/drawCar";
import {
  applyCamera,
  lerp,
  lerpAngle,
  resetCamera,
  updateCamera,
  type Camera,
} from "./render/camera";
import { preloadCarImage } from "./render/preload";
import { ParticleSystem } from "./render/particles";
import { TRACK_Y } from "./physics/constants";

interface Props {
  keyframes: RaceKeyframe[];
  segments: TrackSegment[];
  success: boolean;
  playing: boolean;
  carId?: string;
  onComplete?: () => void;
}

function interpolateKeyframes(
  keyframes: RaceKeyframe[],
  progress: number,
): RaceKeyframe {
  if (keyframes.length === 0) {
    return {
      tick: 0,
      x: 0,
      y: TRACK_Y,
      angle: 0,
      velocity: 0,
      segmentIndex: 0,
    };
  }
  if (keyframes.length === 1 || progress <= 0) return keyframes[0]!;

  const maxTick = keyframes[keyframes.length - 1]!.tick;
  const targetTick = progress * maxTick;

  let i = 0;
  while (i < keyframes.length - 2 && keyframes[i + 1]!.tick < targetTick) {
    i++;
  }

  const a = keyframes[i]!;
  const b = keyframes[i + 1]!;
  const span = b.tick - a.tick;
  const t = span > 0 ? (targetTick - a.tick) / span : 0;

  return {
    tick: lerp(a.tick, b.tick, t),
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    angle: lerpAngle(a.angle, b.angle, t),
    velocity: lerp(a.velocity, b.velocity, t),
    segmentIndex: t < 0.5 ? a.segmentIndex : b.segmentIndex,
    boosting: a.boosting || b.boosting,
    airborne: a.airborne || b.airborne,
  };
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
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const particlesRef = useRef(new ParticleSystem());
  const completedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    preloadCarImage(carId).then(() => setReady(true));
  }, [carId]);

  useEffect(() => {
    if (!playing || keyframes.length === 0 || !ready) return;

    completedRef.current = false;
    particlesRef.current = new ParticleSystem();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    canvas.width = viewW * dpr;
    canvas.height = viewH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bounds = getTrackBounds(segments);
    const durationMs = getPlaybackDurationMs(
      keyframes[keyframes.length - 1]?.tick ?? 0,
    );
    const startTime = performance.now();
    let lastBoost = false;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const kf = interpolateKeyframes(keyframes, progress);

      cameraRef.current = updateCamera(
        cameraRef.current,
        kf.x,
        kf.y,
        viewW,
        viewH,
      );

      ctx.clearRect(0, 0, viewW, viewH);

      applyCamera(ctx, cameraRef.current);
      drawBackground(ctx, cameraRef.current.x, viewW, viewH, bounds.minY);
      drawTrack(ctx, segments, now);

      if (kf.boosting && !lastBoost) {
        particlesRef.current.emitBoost(kf.x - 30, kf.y);
      }
      if (kf.velocity > 25 && !kf.airborne) {
        particlesRef.current.emitDust(kf.x - 20, kf.y + 8, 1);
      }
      if (progress >= 0.98 && success) {
        particlesRef.current.emitConfetti(kf.x, kf.y - 20);
      }
      lastBoost = !!kf.boosting;

      particlesRef.current.update();
      particlesRef.current.draw(ctx);

      drawCar(ctx, kf.x, kf.y, kf.angle, kf.velocity, carId, !!kf.boosting);

      resetCamera(ctx);

      if (progress < 1) {
        requestAnimationFrame(render);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [keyframes, segments, success, playing, carId, onComplete, ready]);

  return (
    <div className="race-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
