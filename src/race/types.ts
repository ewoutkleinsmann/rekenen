import type { TrackSegment } from "../config/schemas";
import type { EffectiveStats } from "../garage/stats";

export interface RaceKeyframe {
  tick: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  segmentIndex: number;
  boosting?: boolean;
  airborne?: boolean;
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

export interface TrackLayoutData {
  pathPoints: { x: number; y: number; angle: number; segmentIndex: number }[];
  finishX: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}
