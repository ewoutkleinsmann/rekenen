import type { TrackConfig } from "../../config/schemas";
import { raceTimeLimitSeconds } from "./segmentPhysics";

export function trackTierFromId(trackId: string): number {
  return Number.parseInt(trackId.replace(/\D/g, ""), 10) || 1;
}

/** Par time: explicit `timeLimitSec` on the track, else geometry-derived default. */
export function resolveTrackTimeLimitSec(
  track: TrackConfig,
  finishDist: number,
): number {
  if (
    typeof track.timeLimitSec === "number" &&
    Number.isFinite(track.timeLimitSec) &&
    track.timeLimitSec > 0
  ) {
    return track.timeLimitSec;
  }
  return raceTimeLimitSeconds(finishDist, trackTierFromId(track.id));
}

export function formatRaceClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const whole = Math.floor(s);
  const tenths = Math.floor((s - whole) * 10);
  const m = Math.floor(whole / 60);
  const sec = whole % 60;
  if (m > 0) {
    return `${m}:${sec.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${sec}.${tenths}`;
}
