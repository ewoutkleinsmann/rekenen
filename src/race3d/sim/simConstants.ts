/** Fixed simulation timestep (seconds). Keeps the sim fully deterministic. */
export const SIM_DT = 1 / 60;
/** Hard cap so a pathological car can never loop forever. */
export const MAX_TICKS = 12_000;
/** Minimum on-screen playback duration in ms. */
export const MIN_PLAYBACK_MS = 9_000;
/** How many ticks between recorded frames (kept dense for smooth 3D playback). */
export const FRAME_INTERVAL = 1;

/** Converts a game-velocity scalar into world units travelled per second. */
export const DIST_SCALE = 0.5;
/** Visual wheel radius in world units (matches the car models). */
export const WHEEL_RADIUS = 0.55;

/** Half-extents of the simulated car chassis (world units). */
export const CAR_HALF: [number, number, number] = [1.0, 0.5, 2.0];
/** Height the chassis centre rides above the road surface. */
export const CAR_RIDE_HEIGHT = 0.7;

/** Gravity used by the headless rapier world. */
export const SIM_GRAVITY = -9.81;
