/**
 * Balance matrix: tracks (rows) × car+upgrade scenarios (columns).
 *
 * Usage:
 *   pnpm race-matrix
 *   MATRIX_MODE=full pnpm race-matrix
 *   MATRIX_MD=balance/race-matrix.md MATRIX_CSV=balance/race-matrix.csv pnpm race-matrix
 *   MATRIX_VERBOSE=balance/race-matrix-detail.csv pnpm race-matrix
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  buildMatrixScenarios,
  formatMatrixCsv,
  formatMatrixCsvVerbose,
  formatMatrixMarkdown,
  formatScenarioLegend,
  runRaceMatrix,
  type MatrixScenarioMode,
} from "../src/race3d/sim/raceMatrix";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function writeOptional(path: string | undefined, body: string) {
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, "utf8");
  console.error(`Wrote ${path}`);
}

function envPath(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export async function main() {
  const mode: MatrixScenarioMode =
    hasFlag("--full") || process.env.MATRIX_MODE === "full" ? "full" : "default";
  const scenarios = buildMatrixScenarios(mode);
  console.error(
    `Running race matrix (${mode}): ${scenarios.length} scenarios × tracks…`,
  );

  const result = await runRaceMatrix({ mode });

  const md = formatMatrixMarkdown(result);
  const csv = formatMatrixCsv(result);
  const legend = formatScenarioLegend(result);

  const mdPath = argValue("--md") ?? envPath("MATRIX_MD");
  const csvPath = argValue("--csv") ?? envPath("MATRIX_CSV");
  const verbosePath = argValue("--verbose") ?? envPath("MATRIX_VERBOSE");

  if (mdPath || csvPath || verbosePath) {
    await writeOptional(mdPath, `${md}\n\n## Scenario legend\n\n${legend}\n`);
    await writeOptional(csvPath, csv);
    if (verbosePath) {
      await writeOptional(verbosePath, formatMatrixCsvVerbose(result));
    }
  }

  console.log(md);
  console.log("\n<!-- scenario legend -->");
  console.log(legend);
}

const isVitest =
  typeof process !== "undefined" &&
  (process.env.VITEST === "true" || process.env.VITEST_WORKER_ID != null);

if (!isVitest) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
