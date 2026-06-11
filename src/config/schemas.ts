import { z } from "zod";

export const CarStatsSchema = z.object({
  speed: z.number(),
  acceleration: z.number(),
  handling: z.number(),
  grip: z.number(),
  boost: z.number(),
  weight: z.number(),
});

export const CarSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  stats: CarStatsSchema,
  trait: z.record(z.string(), z.number()).optional(),
});

export const CarsConfigSchema = z.object({
  cars: z.array(CarSchema),
  statMax: z.number(),
  statMin: z.number(),
});

export const UpgradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  maxLevel: z.number(),
  effectsPerLevel: CarStatsSchema.partial(),
  unlocks: z.array(z.string()).optional(),
});

export const UpgradesConfigSchema = z.object({
  upgrades: z.array(UpgradeSchema),
});

export const QuestionTypeSchema = z.object({
  label: z.string(),
  timeFactor: z.number(),
  description: z.string().optional(),
  display: z.enum(["text", "clock", "money", "measure"]).optional(),
});

export const QuestionTypesConfigSchema = z.object({
  types: z.record(z.string(), QuestionTypeSchema),
});

export const LevelSchema = z.object({
  id: z.number(),
  blok: z.number(),
  name: z.string(),
  baseTimeMs: z.number(),
  questionCategories: z.array(z.string()),
  trackId: z.string(),
});

export const LevelsConfigSchema = z.object({
  levels: z.array(LevelSchema),
});

const SegmentBase = z.object({ type: z.string() });

export const TrackSegmentSchema = z.discriminatedUnion("type", [
  SegmentBase.extend({ type: z.literal("straight"), length: z.number() }),
  SegmentBase.extend({
    type: z.literal("curve"),
    radius: z.number(),
    angle: z.number(),
    minGrip: z.number(),
    direction: z.enum(["left", "right"]).optional(),
  }),
  SegmentBase.extend({
    type: z.literal("booster"),
    boostMultiplier: z.number(),
  }),
  SegmentBase.extend({
    type: z.literal("loop"),
    radius: z.number(),
    minEntrySpeed: z.number(),
    minGrip: z.number(),
  }),
  SegmentBase.extend({
    type: z.literal("jump"),
    length: z.number(),
    minSpeed: z.number(),
    maxWeight: z.number(),
  }),
  SegmentBase.extend({
    type: z.literal("rocket"),
    boostMultiplier: z.number(),
  }),
]);

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  segments: z.array(TrackSegmentSchema),
  finishCondition: z.string(),
});

export const TracksConfigSchema = z.object({
  tracks: z.array(TrackSchema),
});

export const ScoringConfigSchema = z.object({
  baseCorrect: z.number(),
  maxTimeBonus: z.number(),
  questionsPerRound: z.number(),
  minTimeMs: z.number(),
  maxTimeMs: z.number(),
  startingCredits: z.number(),
  starterCarId: z.string(),
});

export type CarStats = z.infer<typeof CarStatsSchema>;
export type CarConfig = z.infer<typeof CarSchema>;
export type UpgradeConfig = z.infer<typeof UpgradeSchema>;
export type QuestionTypeConfig = z.infer<typeof QuestionTypeSchema>;
export type LevelConfig = z.infer<typeof LevelSchema>;
export type TrackSegment = z.infer<typeof TrackSegmentSchema>;
export type TrackConfig = z.infer<typeof TrackSchema>;
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;
