export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function updateCamera(
  cam: Camera,
  targetX: number,
  targetY: number,
  viewW: number,
  viewH: number,
): Camera {
  const desiredX = targetX - viewW * 0.28;
  const desiredY = targetY - viewH * 0.55;
  return {
    x: lerp(cam.x, desiredX, 0.08),
    y: lerp(cam.y, desiredY, 0.06),
    zoom: cam.zoom,
  };
}

export function applyCamera(ctx: CanvasRenderingContext2D, cam: Camera) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
}

export function resetCamera(ctx: CanvasRenderingContext2D) {
  ctx.restore();
}
