import { describe, it, expect } from "vitest";
import { getTrack } from "../../src/config/loadConfig";
import { computeEffectiveStats } from "../../src/garage/stats";
import { simulateRace3D } from "../../src/race3d/sim/simulateRace3d";
import type { CarInstance } from "../../src/game/types";

const TRACK = "track-07";

async function runGrip(
  upgrades: CarInstance["upgrades"],
): Promise<{ ok: boolean; reason?: string }> {
  const stats = computeEffectiveStats({
    instanceId: "probe",
    carId: "grip-gt",
    upgrades,
  });
  const r = await simulateRace3D(stats, getTrack(TRACK));
  return { ok: r.success, reason: r.failureReason };
}

function label(upgrades: CarInstance["upgrades"]): string {
  if (upgrades.length === 0) return "stock";
  return upgrades
    .map((u) => {
      const ab: Record<string, string> = {
        slicks: "SL",
        "sport-steering": "ST",
        "super-charger-motor": "MO",
        "lightweight-chassis": "LW",
        "power-booster-kit": "PB",
        "baan-blaster-rockets": "RK",
      };
      return `${ab[u.upgradeId] ?? u.upgradeId}${u.level}`;
    })
    .join("+");
}

describe("Grip GT minimal upgrades for track-07", () => {
  it("reports single-upgrade max levels and minimal combos", async () => {
    const singles: CarInstance["upgrades"][] = [
      [{ upgradeId: "super-charger-motor", level: 5 }],
      [{ upgradeId: "slicks", level: 5 }],
      [{ upgradeId: "sport-steering", level: 5 }],
      [{ upgradeId: "lightweight-chassis", level: 3 }],
      [{ upgradeId: "power-booster-kit", level: 4 }],
      [{ upgradeId: "baan-blaster-rockets", level: 1 }],
    ];

    console.log("\n=== Enkel één upgrade (max level) ===");
    for (const up of singles) {
      const { ok, reason } = await runGrip(up);
      console.log(`${label(up)}: ${ok ? "PASS" : "fail"}${reason ? ` (${reason})` : ""}`);
    }

    console.log("\n=== Slicks level sweep (alleen SL) ===");
    for (let lv = 1; lv <= 5; lv++) {
      const { ok } = await runGrip([{ upgradeId: "slicks", level: lv }]);
      console.log(`SL${lv}: ${ok ? "PASS" : "fail"}`);
    }

    console.log("\n=== Motor level sweep (alleen MO) ===");
    for (let lv = 1; lv <= 5; lv++) {
      const { ok } = await runGrip([
        { upgradeId: "super-charger-motor", level: lv },
      ]);
      console.log(`MO${lv}: ${ok ? "PASS" : "fail"}`);
    }

    const gripGtMax: CarInstance["upgrades"] = [
      { upgradeId: "slicks", level: 5 },
      { upgradeId: "sport-steering", level: 5 },
      { upgradeId: "super-charger-motor", level: 5 },
      { upgradeId: "lightweight-chassis", level: 3 },
      { upgradeId: "baan-blaster-rockets", level: 1 },
    ];

    expect((await runGrip(gripGtMax)).ok).toBe(true);

    console.log("\n=== Weglaten uit gripGtMax (drop-one) ===");
    for (let i = 0; i < gripGtMax.length; i++) {
      const reduced = gripGtMax.filter((_, j) => j !== i);
      const { ok } = await runGrip(reduced);
      console.log(`zonder ${label([gripGtMax[i]!])}: ${ok ? "PASS" : "fail"}`);
    }

    console.log("\n=== Paar-combo’s (grip-gericht) ===");
    const pairs: CarInstance["upgrades"][] = [
      [
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "sport-steering", level: 5 },
      ],
      [
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "super-charger-motor", level: 5 },
      ],
      [
        { upgradeId: "slicks", level: 4 },
        { upgradeId: "sport-steering", level: 4 },
      ],
      [
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "sport-steering", level: 3 },
      ],
      [
        { upgradeId: "slicks", level: 3 },
        { upgradeId: "sport-steering", level: 5 },
      ],
      [
        { upgradeId: "slicks", level: 5 },
        { upgradeId: "super-charger-motor", level: 3 },
      ],
    ];
    for (const up of pairs) {
      const { ok, reason } = await runGrip(up);
      console.log(
        `${label(up)}: ${ok ? "PASS" : "fail"}${reason ? ` (${reason})` : ""}`,
      );
    }

    console.log("\n=== Zoek kleinste passing subset (BFS from gripGtMax) ===");
    const passing: string[] = [];
    const queue: CarInstance["upgrades"][] = [gripGtMax];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const up = queue.shift()!;
      const key = label(up);
      if (seen.has(key)) continue;
      seen.add(key);
      const { ok } = await runGrip(up);
      if (!ok) continue;
      passing.push(key);
      for (let i = 0; i < up.length; i++) {
        const smaller = up.filter((_, j) => j !== i);
        if (smaller.length > 0) queue.push(smaller);
      }
    }

    passing.sort((a, b) => a.split("+").length - b.split("+").length || a.localeCompare(b));
    console.log("Passing builds (sorted by #upgrades):");
    for (const p of passing.slice(0, 15)) {
      console.log(`  ${p} (${p.split("+").length} lines)`);
    }
    const minimal = passing.filter(
      (p, _, arr) =>
        !arr.some(
          (q) =>
            q !== p &&
            q.split("+").length < p.split("+").length &&
            p.includes(q.split("+")[0] ?? ""),
        ),
    );
    const byCount = passing.reduce(
      (m, p) => {
        const n = p.split("+").length;
        if (!m[n]) m[n] = [];
        m[n]!.push(p);
        return m;
      },
      {} as Record<number, string[]>,
    );
    const minCount = Math.min(...Object.keys(byCount).map(Number));
    console.log(`\nKleinste aantal upgradelijnen dat passed: ${minCount}`);
    console.log(byCount[minCount]?.join("\n") ?? "(none)");

    console.log("\n=== Level-varianten op SL5+ST5+MO (drie lijnen) ===");
    for (const [sl, st, mo] of [
      [5, 5, 5],
      [5, 5, 4],
      [5, 5, 3],
      [5, 4, 5],
      [4, 5, 5],
      [4, 4, 5],
      [4, 4, 4],
      [3, 5, 5],
    ] as const) {
      const up: CarInstance["upgrades"] = [
        { upgradeId: "slicks", level: sl },
        { upgradeId: "sport-steering", level: st },
        { upgradeId: "super-charger-motor", level: mo },
      ];
      const { ok } = await runGrip(up);
      console.log(`${label(up)}: ${ok ? "PASS" : "fail"}`);
    }
  });
});
