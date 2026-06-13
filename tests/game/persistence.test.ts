import { describe, it, expect, beforeEach } from "vitest";
import { createNewSave, serializeSave, deserializeSave, SAVE_KEY } from "../../src/game/persistence";

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates valid new save", () => {
    const save = createNewSave("Test");
    expect(save.version).toBe(1);
    expect(save.level).toBe(1);
    expect(save.ownedCars.length).toBe(1);
  });

  it("round-trips serialize/deserialize", () => {
    const save = createNewSave();
    save.credits = 200;
    save.level = 3;
    save.stats.totalCorrect = 10;
    const raw = serializeSave(save);
    const loaded = deserializeSave(raw);
    expect(loaded.credits).toBe(200);
    expect(loaded.level).toBe(3);
  });

  it("uses correct storage key", () => {
    expect(SAVE_KEY).toBe("hot-wheels-rekenen-save");
  });

  it("keeps legacy saves with original starter garage intact", () => {
    const legacy = {
      version: 1 as const,
      level: 8,
      credits: 120,
      ownedCars: [
        {
          instanceId: "abc",
          carId: "booster-blaze",
          upgrades: [{ upgradeId: "slicks", level: 2 }],
        },
        {
          instanceId: "def",
          carId: "jump-jet",
          upgrades: [],
        },
      ],
      phase: "title" as const,
      stats: { totalRaces: 2, totalCorrect: 10, racesWon: 1 },
    };
    const loaded = deserializeSave(JSON.stringify(legacy));
    expect(loaded.level).toBe(8);
    expect(loaded.ownedCars).toHaveLength(2);
    expect(loaded.ownedCars[0]!.carId).toBe("booster-blaze");
  });

  it("drops removed car ids without wiping the save", () => {
    const raw = JSON.stringify({
      version: 1,
      level: 2,
      credits: 50,
      ownedCars: [
        { instanceId: "1", carId: "booster-blaze", upgrades: [] },
        { instanceId: "2", carId: "removed-mod-car", upgrades: [] },
      ],
      phase: "title",
      stats: { totalRaces: 0, totalCorrect: 0, racesWon: 0 },
    });
    const loaded = deserializeSave(raw);
    expect(loaded.ownedCars.map((c) => c.carId)).toEqual(["booster-blaze"]);
  });

  it("clamps inflated credits using totalCorrect and garage spend", () => {
    const raw = JSON.stringify({
      version: 1,
      level: 3,
      credits: 2000,
      ownedCars: [
        { instanceId: "1", carId: "booster-blaze", upgrades: [] },
      ],
      phase: "shop",
      roundState: {
        questionIndex: 10,
        seed: 1,
        creditsThisRound: 28,
        answers: [],
        currentQuestions: [],
      },
      stats: { totalRaces: 1, totalCorrect: 4, racesWon: 0 },
    });
    const loaded = deserializeSave(raw);
    expect(loaded.credits).toBeLessThanOrEqual(4 * 25);
    expect(loaded.roundState?.creditsThisRound).toBe(0);
    expect(loaded.roundState?.roundEarned).toBe(28);
  });
});
