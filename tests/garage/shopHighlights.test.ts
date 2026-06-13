import { describe, it, expect } from "vitest";
import { getLevelShopHighlights } from "../../src/garage/shopHighlights";

describe("shopHighlights", () => {
  it("flags new cars at unlock level", () => {
    const h = getLevelShopHighlights(4, [
      { instanceId: "1", carId: "booster-blaze", upgrades: [] },
    ]);
    expect(h.newCarsThisLevel.some((c) => c.id === "jump-jet")).toBe(true);
  });

  it("reports upgrade room on starter garage", () => {
    const h = getLevelShopHighlights(1, [
      { instanceId: "1", carId: "booster-blaze", upgrades: [] },
    ]);
    expect(h.upgradesAvailable).toBe(true);
    expect(h.upgradeSlotsRemaining).toBeGreaterThan(0);
  });
});
