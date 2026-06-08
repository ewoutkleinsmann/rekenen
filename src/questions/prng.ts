export function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function pickScenario<T>(
  seed: number,
  index: number,
  offset: number,
  scenarios: Array<() => T>,
): T {
  const rng = createPrng(seed + index * offset + 99991);
  const jitter = Math.floor(rng() * scenarios.length);
  const scenarioIndex = (index + jitter) % scenarios.length;
  return scenarios[scenarioIndex]!();
}
