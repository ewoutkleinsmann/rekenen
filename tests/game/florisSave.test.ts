import { describe, it, expect } from "vitest";
import { deserializeSave } from "../../src/game/persistence";
import {
  estimateLifetimeSpent,
  maxCreditsAllowed,
} from "../../src/garage/creditBounds";
import type { GameSave } from "../../src/game/types";

/** Real save shape reported by player (Floris, level 7). */
const FLORIS_SAVE_JSON = `{"version":1,"playerName":"Floris","level":7,"credits":78,"ownedCars":[{"instanceId":"booster-blaze-1781190949197-4mmvh","carId":"booster-blaze","upgrades":[{"upgradeId":"power-booster-kit","level":1},{"upgradeId":"slicks","level":2},{"upgradeId":"sport-steering","level":1},{"upgradeId":"super-charger-motor","level":1}]},{"instanceId":"jump-jet-1781192882652-mbxop","carId":"jump-jet","upgrades":[{"upgradeId":"lightweight-chassis","level":1},{"upgradeId":"power-booster-kit","level":1},{"upgradeId":"super-charger-motor","level":1}]},{"instanceId":"loop-king-1781194354092-4b9og","carId":"loop-king","upgrades":[{"upgradeId":"power-booster-kit","level":1},{"upgradeId":"super-charger-motor","level":1},{"upgradeId":"slicks","level":2}]},{"instanceId":"grip-gt-1781195404644-nzrrb","carId":"grip-gt","upgrades":[{"upgradeId":"super-charger-motor","level":1},{"upgradeId":"power-booster-kit","level":1}]}],"phase":"result","stats":{"totalRaces":26,"totalCorrect":123,"racesWon":12},"roundState":{"questionIndex":10,"seed":620738,"creditsThisRound":135,"answers":[{"questionId":"money_mixed-620738-0","correct":true,"points":18,"timeMs":43200,"timeRemainingMs":22399.89999999851},{"questionId":"table_6-620738-1","correct":false,"points":0,"timeMs":19800,"timeRemainingMs":0},{"questionId":"table_8-620738-2","correct":false,"points":0,"timeMs":19800,"timeRemainingMs":0},{"questionId":"table_4-620738-3","correct":true,"points":18,"timeMs":19800,"timeRemainingMs":9399.80000000447},{"questionId":"table_8-620738-4","correct":false,"points":0,"timeMs":19800,"timeRemainingMs":0},{"questionId":"table_8-620738-5","correct":true,"points":15,"timeMs":19800,"timeRemainingMs":4949.79999999702},{"questionId":"duration_minutes-620738-6","correct":true,"points":18,"timeMs":41400,"timeRemainingMs":19749.89999999851},{"questionId":"table_6-620738-7","correct":true,"points":22,"timeMs":19800,"timeRemainingMs":15749.80000000447},{"questionId":"table_8-620738-8","correct":true,"points":22,"timeMs":19800,"timeRemainingMs":15949},{"questionId":"table_4-620738-9","correct":true,"points":22,"timeMs":19800,"timeRemainingMs":16749.79999999702}],"currentQuestions":[]},"lastRaceResult":{"success":false,"failureReason":"Tijd op — rij sneller!","carInstanceId":"grip-gt-1781195404644-nzrrb"},"selectedCarInstanceId":"grip-gt-1781195404644-nzrrb"}`;

describe("Floris level-7 save", () => {
  const parsed = JSON.parse(FLORIS_SAVE_JSON) as GameSave;

  it("sanity: answer points sum matches creditsThisRound", () => {
    const sum = parsed.roundState!.answers.reduce((a, x) => a + x.points, 0);
    expect(sum).toBe(135);
    expect(parsed.roundState!.creditsThisRound).toBe(135);
  });

  it("garage spend leaves room for 78 credits under the ceiling", () => {
    const spent = estimateLifetimeSpent(parsed.ownedCars);
    expect(spent).toBe(2405);
    const ceiling = maxCreditsAllowed(parsed);
    expect(ceiling).toBeGreaterThanOrEqual(78);
    expect(parsed.credits).toBeLessThanOrEqual(ceiling);
  });

  it("deserialize keeps 78 credits and all four cars", () => {
    const loaded = deserializeSave(FLORIS_SAVE_JSON);
    expect(loaded.playerName).toBe("Floris");
    expect(loaded.level).toBe(7);
    expect(loaded.credits).toBe(78);
    expect(loaded.phase).toBe("result");
    expect(loaded.ownedCars).toHaveLength(4);
    expect(loaded.lastRaceResult?.success).toBe(false);
    expect(loaded.selectedCarInstanceId).toBe(
      "grip-gt-1781195404644-nzrrb",
    );
  });

  it("moves stale creditsThisRound to roundEarned without changing credits", () => {
    const loaded = deserializeSave(FLORIS_SAVE_JSON);
    expect(loaded.roundState?.creditsThisRound).toBe(0);
    expect(loaded.roundState?.roundEarned).toBe(135);
    expect(loaded.credits).toBe(78);
  });
});
