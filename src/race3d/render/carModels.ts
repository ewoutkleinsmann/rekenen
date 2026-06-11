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
}

const CAR_MODELS: Record<string, CarModelDef> = {
  "booster-blaze": { color: "#ff5a1f", accent: "#2a0c02" },
  "grip-gt": { color: "#23d18b", accent: "#0b3d2e" },
  "jump-jet": { color: "#1fb6ff", accent: "#06283d" },
  "loop-king": { color: "#a855f7", accent: "#2e1065" },
  "rocket-racer": { color: "#ffd000", accent: "#3d2f00" },
};

const FALLBACK: CarModelDef = { color: "#ff5a1f", accent: "#222222" };

export function getCarModel(carId: string | undefined): CarModelDef {
  if (!carId) return FALLBACK;
  return CAR_MODELS[carId] ?? FALLBACK;
}

/** Standard car length (world units) used to normalise loaded GLB models. */
export const CAR_LENGTH = 4;
