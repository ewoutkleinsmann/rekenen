import { describe, it, expect } from "vitest";
import { maxCreditsAllowed } from "../../src/garage/creditBounds";
import type { GameSave } from "../../src/game/types";

function baseSave(overrides: Partial<GameSave>): GameSave {
  return {
    version: 1,
    level: 1,
    credits: 0,
    ownedCars: [{ instanceId: "1", carId: "booster-blaze", upgrades: [] }],
    phase: "title",
    stats: { totalRaces: 0, totalCorrect: 0, racesWon: 0 },
    ...overrides,
  };
}

describe("creditBounds", () => {
  it("caps credits from totalCorrect when no purchases", () => {
    const save = baseSave({
      credits: 9999,
      stats: { totalRaces: 2, totalCorrect: 4, racesWon: 1 },
    });
    expect(maxCreditsAllowed(save)).toBe(100);
  });

  it("includes in-quiz creditsThisRound in the allowed total", () => {
    const save = baseSave({
      phase: "quiz",
      stats: { totalRaces: 0, totalCorrect: 2, racesWon: 0 },
      roundState: {
        questionIndex: 2,
        seed: 1,
        creditsThisRound: 40,
        answers: [],
        currentQuestions: [],
      },
    });
    expect(maxCreditsAllowed(save)).toBe(2 * 25 + 40);
  });
});
