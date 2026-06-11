import { describe, it, expect } from "vitest";
import { getTracksConfig } from "../../src/config/loadConfig";
import { buildTrack3d } from "../../src/race3d/sim/buildTrack3d";
import { resolveTrackTimeLimitSec } from "../../src/race3d/sim/trackTimeLimit";

describe("track time limits", () => {
  it("every track defines timeLimitSec in config", () => {
    const { tracks } = getTracksConfig();
    expect(tracks.length).toBe(19);
    for (const track of tracks) {
      expect(
        track.timeLimitSec,
        `${track.id} missing timeLimitSec`,
      ).toBeGreaterThan(5);
    }
  });

  it("configured limits match geometry resolver when set", () => {
    const { tracks } = getTracksConfig();
    for (const track of tracks) {
      const dist = buildTrack3d(track).finishDist;
      const resolved = resolveTrackTimeLimitSec(track, dist);
      expect(track.timeLimitSec).toBeCloseTo(resolved, 5);
    }
  });
});
