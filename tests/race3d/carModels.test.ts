import { describe, it, expect } from "vitest";
import { getCarsConfig } from "../../src/config/loadConfig";
import {
  getCarModel,
  getAllCarModelEntries,
} from "../../src/race3d/render/carModels";

describe("car GLB registry", () => {
  it("maps every config car to a GLB", () => {
    for (const car of getCarsConfig().cars) {
      const def = getCarModel(car.id);
      expect(def.glb, car.id).toBeDefined();
      expect(def.glb).toMatch(/^\/assets\/cars3d\/.+\.glb$/);
    }
  });

  it("loads booster blaze with 180° correction", () => {
    const def = getCarModel("booster-blaze");
    expect(def.glb).toBe("/assets/cars3d/booster-blaze.glb");
    expect(def.rotationY).toBe(Math.PI);
  });

  it("registers eight playable car models", () => {
    expect(getAllCarModelEntries().length).toBe(8);
  });
});
