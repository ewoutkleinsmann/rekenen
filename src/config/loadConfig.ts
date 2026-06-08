import levelsJson from "../../config/levels.json";
import questionTypesJson from "../../config/question-types.json";
import carsJson from "../../config/cars.json";
import upgradesJson from "../../config/upgrades.json";
import tracksJson from "../../config/tracks.json";
import scoringJson from "../../config/scoring.json";
import {
  LevelsConfigSchema,
  QuestionTypesConfigSchema,
  CarsConfigSchema,
  UpgradesConfigSchema,
  TracksConfigSchema,
  ScoringConfigSchema,
  type LevelConfig,
  type TrackConfig,
  type CarConfig,
  type UpgradeConfig,
  type ScoringConfig,
  type QuestionTypeConfig,
} from "./schemas";

function parse<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  name: string,
): T {
  try {
    return schema.parse(data);
  } catch (e) {
    throw new Error(`Invalid config: ${name}`, { cause: e });
  }
}

const levelsConfig = parse(LevelsConfigSchema, levelsJson, "levels.json");
const questionTypesConfig = parse(
  QuestionTypesConfigSchema,
  questionTypesJson,
  "question-types.json",
);
const carsConfig = parse(CarsConfigSchema, carsJson, "cars.json");
const upgradesConfig = parse(
  UpgradesConfigSchema,
  upgradesJson,
  "upgrades.json",
);
const tracksConfig = parse(TracksConfigSchema, tracksJson, "tracks.json");
const scoringConfig = parse(ScoringConfigSchema, scoringJson, "scoring.json");

export function getLevelsConfig() {
  return levelsConfig;
}

export function getQuestionTypesConfig() {
  return questionTypesConfig;
}

export function getCarsConfig() {
  return carsConfig;
}

export function getUpgradesConfig() {
  return upgradesConfig;
}

export function getTracksConfig() {
  return tracksConfig;
}

export function getScoringConfig() {
  return scoringConfig;
}

export function getLevel(id: number): LevelConfig {
  const level = levelsConfig.levels.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
}

export function getTrack(id: string): TrackConfig {
  const track = tracksConfig.tracks.find((t) => t.id === id);
  if (!track) throw new Error(`Track ${id} not found`);
  return track;
}

export function getCar(id: string): CarConfig {
  const car = carsConfig.cars.find((c) => c.id === id);
  if (!car) throw new Error(`Car ${id} not found`);
  return car;
}

export function getUpgrade(id: string): UpgradeConfig {
  const upgrade = upgradesConfig.upgrades.find((u) => u.id === id);
  if (!upgrade) throw new Error(`Upgrade ${id} not found`);
  return upgrade;
}

export function getQuestionType(id: string): QuestionTypeConfig {
  const type = questionTypesConfig.types[id];
  if (!type) throw new Error(`Question type ${id} not found`);
  return type;
}

export function getAllQuestionTypeIds(): string[] {
  return Object.keys(questionTypesConfig.types);
}

export {
  scoringConfig,
  levelsConfig,
  questionTypesConfig,
  carsConfig,
  upgradesConfig,
  tracksConfig,
};
export type {
  LevelConfig,
  TrackConfig,
  CarConfig,
  UpgradeConfig,
  ScoringConfig,
  QuestionTypeConfig,
};
