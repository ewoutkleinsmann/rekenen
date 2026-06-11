import type { MutableRefObject } from "react";

/** Helicopter orbit before the replay starts advancing. */
export const RACE_INTRO_MS = 4_500;

export interface PlaybackState {
  /** performance.now() timestamp when playback started, or null before start. */
  startTime: number | null;
  /** Race replay duration in milliseconds (excludes intro). */
  durationMs: number;
}

export type PlaybackRef = MutableRefObject<PlaybackState>;

function elapsed(state: PlaybackState): number {
  if (state.startTime == null) return 0;
  return performance.now() - state.startTime;
}

/** 0..1 during the opening helicopter orbit. */
export function introProgress(state: PlaybackState): number {
  return Math.min(1, elapsed(state) / RACE_INTRO_MS);
}

/** 0..1 race replay progress (frozen at 0 during intro). */
export function raceProgress(state: PlaybackState): number {
  if (state.startTime == null) return 0;
  const t = elapsed(state) - RACE_INTRO_MS;
  if (t <= 0) return 0;
  return Math.min(1, t / state.durationMs);
}

/** Full timeline including intro (for end detection). */
export function totalProgress(state: PlaybackState): number {
  if (state.startTime == null) return 0;
  return Math.min(1, elapsed(state) / (RACE_INTRO_MS + state.durationMs));
}

/** @deprecated Use raceProgress */
export function playbackProgress(state: PlaybackState): number {
  return raceProgress(state);
}
