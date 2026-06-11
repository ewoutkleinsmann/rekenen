import type { MutableRefObject } from "react";

export interface PlaybackState {
  /** performance.now() timestamp when playback started, or null before start. */
  startTime: number | null;
  /** Total playback duration in milliseconds. */
  durationMs: number;
}

export type PlaybackRef = MutableRefObject<PlaybackState>;

export function playbackProgress(state: PlaybackState): number {
  if (state.startTime == null) return 0;
  return Math.min(1, (performance.now() - state.startTime) / state.durationMs);
}
