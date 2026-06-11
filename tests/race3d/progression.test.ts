import { describe, it, expect } from "vitest";
import {
  PROGRESSION_LOADOUTS,
  simulateLoadoutOnTrack,
  type ProgressionLoadoutId,
} from "../../src/race3d/sim/progressionFixtures";
import { getLevel } from "../../src/config/loadConfig";

type Expectation = "pass" | "fail";

/**
 * Progression contract: cheap builds must not trivialize late tracks;
 * fully invested builds must remain able to win.
 */
const PROGRESSION: Record<
  string,
  Partial<Record<ProgressionLoadoutId, Expectation>>
> = {
  "track-01": { starter: "pass", starterSlicks2: "pass" },
  "track-02": { starter: "pass", starterSlicks2: "pass" },
  "track-03": {
    starter: "fail",
    starterSlicks2: "pass",
  },
  "track-04": {
    starter: "fail",
    starterSlicks2: "fail",
    jumpJetLight: "pass",
  },
  "track-05": {
    starter: "fail",
    starterSlicks2: "fail",
    loopKingMid: "pass",
  },
  "track-06": {
    jumpJetLight: "pass",
  },
  "track-07": {
    starterSlicks2: "fail",
    gripGtSlicks3: "fail",
    gripGtMax: "pass",
    rocketRacerMax: "fail",
    jumpJetMax: "fail",
  },
  "track-08": {
    starterFull: "pass",
    rocketRacerKit: "pass",
    starterSlicks2: "fail",
  },
  "track-09": {
    starterSlicks2: "fail",
    rocketRacerMax: "pass",
    gripGtMax: "fail",
  },
  "track-10": {
    starter: "fail",
    blazeSpeed5: "pass",
    starterFull: "pass",
    gripGtMax: "fail",
  },
  "track-11": {
    starter: "fail",
    blazeSpeed5: "pass",
    starterMid: "fail",
  },
  "track-12": {
    starterSlicks2: "fail",
    gripGtSlicks3: "fail",
    loopKingHigh: "pass",
  },
  "track-13": {
    starterMid: "fail",
    jumpJetMax: "pass",
    rocketRacerMax: "pass",
  },
  "track-14": {
    loopKingMid: "fail",
    loopKingHigh: "pass",
    gripGtMax: "pass",
  },
  "track-15": {
    gripGtSlicks5: "fail",
    gripGtMax: "pass",
    starterFull: "fail",
  },
  "track-16": {
    starterSlicks2: "fail",
    jumpJetMax: "pass",
  },
  "track-17": {
    starterSlicks2: "fail",
    rocketRacerKit: "pass",
    rocketRacerMax: "pass",
    gripGtMax: "fail",
  },
  "track-18": {
    rocketRacerMax: "pass",
    gripGtMax: "fail",
    starterFull: "fail",
    jumpJetMax: "fail",
  },
  "track-19": {
    starterFull: "fail",
    loopKingHigh: "fail",
    rocketRacerMax: "pass",
    gripGtMax: "fail",
  },
};

describe("race progression matrix", () => {
  for (const [trackId, rules] of Object.entries(PROGRESSION)) {
    describe(trackId, () => {
      for (const [loadoutId, expected] of Object.entries(rules)) {
        const name = loadoutId as ProgressionLoadoutId;
        it(`${name} should ${expected}`, async () => {
          expect(PROGRESSION_LOADOUTS[name]).toBeDefined();
          const { success, failureReason } = await simulateLoadoutOnTrack(
            name,
            trackId,
          );
          if (expected === "pass") {
            expect(success, failureReason).toBe(true);
          } else {
            expect(success).toBe(false);
          }
        });
      }
    });
  }

  it("maps each level to its track id", () => {
    for (let lvl = 1; lvl <= 19; lvl++) {
      const id = lvl < 10 ? `track-0${lvl}` : `track-${lvl}`;
      expect(getLevel(lvl).trackId).toBe(id);
    }
  });
});
