import * as THREE from "three";

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function canvasTexture(
  canvas: HTMLCanvasElement,
  repeat: [number, number],
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = colorSpace;
  return tex;
}

function fillNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 80;
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
}

/** Bump normals from height noise (tangent-space, +Y up). */
function heightToNormalMap(
  heights: Float32Array,
  size: number,
  strength: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    heights[((y % size) * size + (x % size))] ?? 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = 1;
      const nz = -dy;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvasTexture(canvas, [8, 2], THREE.LinearSRGBColorSpace);
}

function roughnessFromHeights(heights: Float32Array, size: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i]!;
    const r = Math.min(255, Math.max(0, (0.55 + h * 0.35) * 255));
    const o = i * 4;
    img.data[o] = r;
    img.data[o + 1] = r;
    img.data[o + 2] = r;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvasTexture(canvas, [8, 2], THREE.LinearSRGBColorSpace);
}

/** Asphalt albedo + normal + roughness (isotropic grain — no stripe bands). */
export function createAsphaltMaps(): SurfaceMaps {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#424750";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 66 + (Math.random() - 0.5) * 22;
    img.data[i] = n;
    img.data[i + 1] = n + 1;
    img.data[i + 2] = n + 3;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const heights = new Float32Array(size * size);
  const id = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < heights.length; i++) {
    heights[i] = id.data[i * 4]! / 255;
  }

  const map = canvasTexture(canvas, [3, 3]);
  const normalMap = heightToNormalMap(heights, size, 0.65);
  const roughnessMap = roughnessFromHeights(heights, size);
  normalMap.repeat.set(3, 3);
  roughnessMap.repeat.set(3, 3);
  return { map, normalMap, roughnessMap };
}

/** Soft turf — large colour patches, no blade streaks (avoids forest / stripe look). */
export function createGrassMaps(): SurfaceMaps {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#5a9a54";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 18 + Math.random() * 42;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() > 0.5;
    g.addColorStop(0, dark ? "#4d8a4a" : "#72b86a");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  fillNoise(ctx, size, size, 18);

  const heights = new Float32Array(size * size);
  const id = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < heights.length; i++) {
    heights[i] = id.data[i * 4]! / 255;
  }

  return {
    map: canvasTexture(canvas, [18, 18]),
    normalMap: heightToNormalMap(heights, size, 0.45),
    roughnessMap: roughnessFromHeights(heights, size),
  };
}

/** Red / white curb stripes (like classic race curbs). */
export function createCurbStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const stripe = 8;
  for (let y = 0; y < 64; y += stripe) {
    ctx.fillStyle = (y / stripe) % 2 === 0 ? "#e62e22" : "#f4f4f4";
    ctx.fillRect(0, y, 64, stripe);
  }
  return canvasTexture(canvas, [1, 12]);
}

/** Finish-line checkered banner (fixes flat black bar at distance). */
export function createCheckeredTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const cell = 16;
  for (let y = 0; y < 64; y += cell) {
    for (let x = 0; x < 128; x += cell) {
      const dark = ((x + y) / cell) % 2 === 0;
      ctx.fillStyle = dark ? "#1a1a1a" : "#f5f5f5";
      ctx.fillRect(x, y, cell, cell);
    }
  }
  return canvasTexture(canvas, [4, 1]);
}

/** @deprecated Use createAsphaltMaps */
export function createAsphaltTexture(): THREE.CanvasTexture {
  return createAsphaltMaps().map;
}

/** @deprecated Use createGrassMaps */
export function createGrassTexture(): THREE.CanvasTexture {
  return createGrassMaps().map;
}

export function disposeSurfaceMaps(maps: SurfaceMaps) {
  maps.map.dispose();
  maps.normalMap.dispose();
  maps.roughnessMap.dispose();
}
