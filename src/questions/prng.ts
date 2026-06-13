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

/** In-place Fisher–Yates shuffle. */
export function shuffleInPlace<T>(rng: () => number, items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
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
