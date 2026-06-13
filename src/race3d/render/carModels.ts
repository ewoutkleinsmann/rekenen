/**
 * Per-car visual mapping. By default each car is rendered as a recoloured
 * procedural low-poly racer. Provide an optional `glb` path to load a real
 * GLTF/GLB model instead (see public/assets/cars3d/README.md).
 */
export interface CarModelDef {
  /** Main body colour. */
  color: string;
  /** Accent colour (spoiler, trim, lower body). */
  accent: string;
  /** Optional GLB model path under /public. */
  glb?: string;
  /** Extra Y rotation (rad) after load; use π if the GLB nose points +Z. */
  rotationY?: number;
}

const PI = Math.PI;

const CAR_MODELS: Record<string, CarModelDef> = {
  "booster-blaze": {
    color: "#ff5a1f",
    accent: "#2a0c02",
    glb: "/assets/cars3d/booster-blaze.glb",
    rotationY: PI,
  },
  "jump-jet": {
    color: "#1fb6ff",
    accent: "#06283d",
    glb: "/assets/cars3d/sol-aire_cx4.glb",
    rotationY: PI,
  },
  "loop-king": {
    color: "#a855f7",
    accent: "#2e1065",
    glb: "/assets/cars3d/free_hot_wheels_acceleracers_-_rd02.glb",
    rotationY: PI,
  },
  "grip-gt": {
    color: "#23d18b",
    accent: "#0b3d2e",
    glb: "/assets/cars3d/free_hot_wheels_acceleracers_-_rat-ified.glb",
    rotationY: PI,
  },
  "rocket-racer": {
    color: "#ffd000",
    accent: "#3d2f00",
    glb: "/assets/cars3d/hot_wheels_rocket-bye-baby_1970_redline_scan.glb",
    rotationY: PI,
  },
  "bone-shaker": {
    color: "#c41e3a",
    accent: "#1a1a1a",
    glb: "/assets/cars3d/boneshaker.glb",
    rotationY: PI,
  },
  "splittin-image": {
    color: "#00ced1",
    accent: "#ff4500",
    glb: "/assets/cars3d/hot_wheels_-_splittin_image_2.glb",
    rotationY: PI,
  },
  "shaker-hammer": {
    color: "#8b0000",
    accent: "#ffd700",
    glb: "/assets/cars3d/hot_wheels_bone_shaker.glb",
    rotationY: PI,
  },
};

const FALLBACK: CarModelDef = { color: "#ff5a1f", accent: "#222222" };

export function getCarModel(carId: string | undefined): CarModelDef {
  if (!carId) return FALLBACK;
  return CAR_MODELS[carId] ?? FALLBACK;
}

/** All registered car model entries (for preloading GLBs). */
export function getAllCarModelEntries(): [string, CarModelDef][] {
  return Object.entries(CAR_MODELS);
}

/** Standard car length (world units) used to normalise loaded GLB models. */
export const CAR_LENGTH = 4;
