import type { TrackSegment } from "../config/schemas";
import type { EffectiveStats } from "../garage/stats";

export interface RaceKeyframe {
  tick: number;
  x: number;
  y: number;
  velocity: number;
  segmentIndex: number;
}

export interface SimulationResult {
  success: boolean;
  failureReason?: string;
  failureSegmentIndex?: number;
  keyframes: RaceKeyframe[];
  totalTicks: number;
}

export interface SimulationInput {
  stats: EffectiveStats;
  segments: TrackSegment[];
}
