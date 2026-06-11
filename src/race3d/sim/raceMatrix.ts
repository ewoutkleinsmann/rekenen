import {
  getCarsConfig,
  getTracksConfig,
  getUpgradesConfig,
} from "../../config/loadConfig";
import { computeEffectiveStats } from "../../garage/stats";
import type { CarInstance } from "../../game/types";
import { simulateRace3D } from "./simulateRace3d";
import { PROGRESSION_LOADOUTS } from "./progressionFixtures";

export interface MatrixScenario {
  id: string;
  /** Column header in reports. */
  label: string;
  carId: string;
  upgrades: CarInstance["upgrades"];
}

export interface MatrixCell {
  success: boolean;
  failureReason?: string;
  totalTime: number;
}

export interface MatrixResult {
  scenarios: MatrixScenario[];
  trackIds: string[];
  cells: Map<string, MatrixCell>;
}

const UPGRADE_ABBR: Record<string, string> = {
  slicks: "SL",
  "sport-steering": "ST",
  "super-charger-motor": "MO",
  "lightweight-chassis": "LW",
  "power-booster-kit": "PB",
  "baan-blaster-rockets": "RK",
};

function scenarioId(carId: string, upgrades: CarInstance["upgrades"]): string {
  if (upgrades.length === 0) return `${carId}__stock`;
  const part = upgrades
    .map((u) => `${u.upgradeId.replace(/-/g, "")}_${u.level}`)
    .sort()
    .join("__");
  return `${carId}__${part}`;
}

function formatUpgrades(upgrades: CarInstance["upgrades"]): string {
  if (upgrades.length === 0) return "—";
  return upgrades
    .map((u) => {
      const ab = UPGRADE_ABBR[u.upgradeId] ?? u.upgradeId.slice(0, 2).toUpperCase();
      return `${ab}${u.level}`;
    })
    .join("+");
}

function carShortName(carId: string): string {
  const name = getCarsConfig().cars.find((c) => c.id === carId)?.name ?? carId;
  const first = name.split(/\s+/)[0] ?? name;
  return first.length > 10 ? carId : first;
}

function inst(
  carId: string,
  upgrades: CarInstance["upgrades"] = [],
): MatrixScenario {
  const label = `${carShortName(carId)} ${formatUpgrades(upgrades)}`.trim();
  return {
    id: scenarioId(carId, upgrades),
    label,
    carId,
    upgrades: upgrades.map((u) => ({ ...u })),
  };
}

function maxUpgrades(): CarInstance["upgrades"] {
  return getUpgradesConfig().upgrades.map((u) => ({
    upgradeId: u.id,
    level: u.maxLevel,
  }));
}

function dedupeScenarios(list: MatrixScenario[]): MatrixScenario[] {
  const seen = new Set<string>();
  const out: MatrixScenario[] = [];
  for (const s of list) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

export type MatrixScenarioMode = "default" | "full";

/**
 * Build column scenarios for the balance matrix.
 * - default: stock, max builds, progression loadouts, common partial builds
 * - full: also single-upgrade level sweeps per car (0→max one upgrade at a time)
 */
export function buildMatrixScenarios(
  mode: MatrixScenarioMode = "default",
): MatrixScenario[] {
  const cars = getCarsConfig().cars;
  const upgrades = getUpgradesConfig().upgrades;
  const list: MatrixScenario[] = [];

  for (const car of cars) {
    list.push(inst(car.id, []));
    list.push(inst(car.id, maxUpgrades()));
  }

  for (const car of cars) {
    list.push(inst(car.id, [{ upgradeId: "slicks", level: 2 }]));
    list.push(inst(car.id, [{ upgradeId: "slicks", level: 3 }]));
    list.push(inst(car.id, [{ upgradeId: "slicks", level: 4 }]));
    list.push(inst(car.id, [{ upgradeId: "slicks", level: 5 }]));
    list.push(
      inst(car.id, [
        { upgradeId: "slicks", level: 2 },
        { upgradeId: "super-charger-motor", level: 2 },
      ]),
    );
    list.push(
      inst(car.id, [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "sport-steering", level: 2 },
        { upgradeId: "super-charger-motor", level: 2 },
      ]),
    );
  }

  for (const [loadoutId, instance] of Object.entries(PROGRESSION_LOADOUTS)) {
    list.push({
      id: `fixture__${loadoutId}`,
      label: `[${loadoutId}]`,
      carId: instance.carId,
      upgrades: instance.upgrades.map((u) => ({ ...u })),
    });
  }

  if (mode === "full") {
    for (const car of cars) {
      for (const up of upgrades) {
        for (let level = 1; level <= up.maxLevel; level++) {
          list.push(inst(car.id, [{ upgradeId: up.id, level }]));
        }
      }
    }
  }

  return dedupeScenarios(list);
}

function cellKey(trackId: string, scenarioId: string): string {
  return `${trackId}\t${scenarioId}`;
}

export async function runRaceMatrix(
  options: {
    mode?: MatrixScenarioMode;
    trackIds?: string[];
    scenarioFilter?: (s: MatrixScenario) => boolean;
  } = {},
): Promise<MatrixResult> {
  const mode = options.mode ?? "default";
  const scenarios = buildMatrixScenarios(mode).filter(
    options.scenarioFilter ?? (() => true),
  );
  const trackIds =
    options.trackIds ??
    getTracksConfig().tracks.map((t) => t.id).sort();

  const { getTrack } = await import("../../config/loadConfig");
  const cells = new Map<string, MatrixCell>();

  for (const trackId of trackIds) {
    const track = getTrack(trackId);
    for (const scenario of scenarios) {
      const instance: CarInstance = {
        instanceId: `matrix-${scenario.id}`,
        carId: scenario.carId,
        upgrades: scenario.upgrades,
      };
      const result = await simulateRace3D(
        computeEffectiveStats(instance),
        track,
      );
      cells.set(cellKey(trackId, scenario.id), {
        success: result.success,
        failureReason: result.failureReason,
        totalTime: result.totalTime,
      });
    }
  }

  return { scenarios, trackIds, cells };
}

export function formatMatrixMarkdown(result: MatrixResult): string {
  const { scenarios, trackIds, cells } = result;
  const header = ["Track", ...scenarios.map((s) => s.label)];
  const lines: string[] = [];
  lines.push("| " + header.join(" | ") + " |");
  lines.push("| " + header.map(() => "---").join(" | ") + " |");
  for (const trackId of trackIds) {
    const row = [
      trackId,
      ...scenarios.map((s) => {
        const c = cells.get(cellKey(trackId, s.id));
        if (!c) return "?";
        return c.success ? "✅" : "❌";
      }),
    ];
    lines.push("| " + row.join(" | ") + " |");
  }
  return lines.join("\n");
}

export function formatMatrixCsv(result: MatrixResult): string {
  const { scenarios, trackIds, cells } = result;
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  const header = ["track_id", ...scenarios.map((s) => s.id)];
  const lines: string[] = [header.map(escape).join(",")];
  for (const trackId of trackIds) {
    const row = [
      trackId,
      ...scenarios.map((s) => {
        const c = cells.get(cellKey(trackId, s.id));
        if (!c) return "";
        return c.success ? "pass" : "fail";
      }),
    ];
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

export function formatMatrixCsvVerbose(result: MatrixResult): string {
  const { scenarios, trackIds, cells } = result;
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  const header = [
    "track_id",
    "scenario_id",
    "car_id",
    "success",
    "total_time",
    "failure_reason",
  ];
  const lines: string[] = [header.map(escape).join(",")];
  for (const trackId of trackIds) {
    for (const s of scenarios) {
      const c = cells.get(cellKey(trackId, s.id));
      if (!c) continue;
      lines.push(
        [
          trackId,
          s.id,
          s.carId,
          c.success ? "pass" : "fail",
          c.totalTime.toFixed(2),
          c.failureReason ?? "",
        ]
          .map(escape)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}

export function formatScenarioLegend(result: MatrixResult): string {
  return result.scenarios
    .map((s) => `- \`${s.id}\`: ${s.label} (${s.carId})`)
    .join("\n");
}
