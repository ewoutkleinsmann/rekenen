const cache = new Map<string, HTMLImageElement>();
const loading = new Map<string, Promise<HTMLImageElement>>();

export function preloadCarImage(carId: string): Promise<HTMLImageElement> {
  const cached = cache.get(carId);
  if (cached) return Promise.resolve(cached);

  const pending = loading.get(carId);
  if (pending) return pending;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(carId, img);
      loading.delete(carId);
      resolve(img);
    };
    img.onerror = reject;
    img.src = `/assets/cars/${carId}.svg`;
  });
  loading.set(carId, promise);
  return promise;
}

export function getCarImage(carId: string): HTMLImageElement | null {
  return cache.get(carId) ?? null;
}

export function preloadAllCars(carIds: string[]): Promise<void> {
  return Promise.all(carIds.map(preloadCarImage)).then(() => undefined);
}
