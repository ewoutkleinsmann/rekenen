import type { QuestionGenerator } from "../types";
import { createPrng, randomInt, pickOne, pickScenario } from "../prng";
import { getQuestionTimeMs } from "../../quiz/time";
import { getQuestionType } from "../../config/loadConfig";
import { getAcceptedClockAnswers } from "../clockAnswer";

function makeId(ctx: { seed: number; index: number }, type: string): string {
  return `${type}-${ctx.seed}-${ctx.index}`;
}

// --- Variety pools so word problems don't always use the same objects ---
const RACERS = [
  "Max",
  "Sophie",
  "Liam",
  "Noa",
  "Emma",
  "Daan",
  "Sara",
  "Finn",
  "Lotte",
  "Tom",
  "Mila",
  "Bram",
];

// Toy vehicles (length in cm)
const TOY_VEHICLES = [
  "speelgoedauto",
  "rallyauto",
  "monstertruck",
  "racekart",
  "stuntauto",
  "speelgoedtruck",
];

// Liquids measured in whole liters + the container they sit in
const LITER_LIQUIDS = [
  { liquid: "water", container: "emmer" },
  { liquid: "limonade", container: "kan" },
  { liquid: "race-olie", container: "fles" },
  { liquid: "regenwater", container: "ton" },
  { liquid: "sap", container: "jerrycan" },
  { liquid: "soep", container: "pan" },
];

// Drinks measured in deciliter
const DECILITER_DRINKS = ["sportdrank", "water", "limonade", "thee", "cola"];
const DECILITER_CONTAINERS = ["beker", "bidon", "flesje", "glas", "kannetje"];

// Things you weigh in kilograms
const KILO_ITEMS = [
  "zak appels",
  "zak aardappels",
  "pak meel",
  "meloen",
  "zak suiker",
  "doos boeken",
];

// Cheap shop items priced in whole cents
const SHOP_ITEMS = [
  "sticker",
  "gum",
  "knikker",
  "stuiterbal",
  "potlood",
  "vlaggetje",
  "sleutelhanger",
  "kauwgombal",
];

// Slightly pricier things bought with euros + cents
const TOY_PRODUCTS = [
  "Hot Wheels auto",
  "racebaan-stuk",
  "stickervel",
  "knikkerzak",
  "petje",
  "poster",
];

// Pick a value from a pool using a deterministic rng
function pick<T>(rng: () => number, pool: readonly T[]): T {
  return pool[Math.floor(rng() * pool.length)]!;
}

// Build an add/subtract prompt that never goes negative.
function addOrSubtract(
  rng: () => number,
  a: number,
  b: number,
): { prompt: string; answer: number } {
  if (rng() > 0.5) {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return { prompt: `${hi} − ${lo} = ?`, answer: hi - lo };
  }
  return { prompt: `${a} + ${b} = ?`, answer: a + b };
}

function baseQuestion(
  ctx: { seed: number; index: number; baseTimeMs: number },
  type: string,
  prompt: string,
  correctAnswer: number,
  display: "text" | "clock" | "money" | "measure" = "text",
  visualData?: import("../types").QuestionVisualData,
) {
  const typeConfig = getQuestionType(type);
  return {
    id: makeId(ctx, type),
    type,
    prompt,
    display: display ?? typeConfig.display ?? "text",
    correctAnswer,
    timeMs: getQuestionTimeMs(ctx.baseTimeMs, type),
    visualData,
  };
}

const addSub30: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 17);
  const a = randomInt(rng, 1, 30);
  const b = randomInt(rng, 1, 15);
  const { prompt, answer } = addOrSubtract(rng, a, b);
  return baseQuestion(ctx, "add_sub_30", prompt, answer);
};

const addSub100: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 19);
  const a = randomInt(rng, 10, 90);
  // Keep the sum within 100 (curriculum groep 4: optellen/aftrekken tot 100).
  const b = randomInt(rng, 1, 100 - a);
  const { prompt, answer } = addOrSubtract(rng, a, b);
  return baseQuestion(ctx, "add_sub_100", prompt, answer);
};

const addSubFromTen: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 29);
  const ten = randomInt(rng, 1, 9) * 10;
  const n = randomInt(rng, 1, 9);
  // ten is always >= n, so subtraction stays non-negative.
  const { prompt, answer } = addOrSubtract(rng, ten, n);
  return baseQuestion(ctx, "add_sub_from_ten", prompt, answer);
};

const addSubTens: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 31);
  const a = randomInt(rng, 2, 9) * 10 + randomInt(rng, 0, 9);
  // Only add when the result can stay within 100.
  const subtract = a > 90 || rng() > 0.5;
  if (subtract) {
    // Keep the subtrahend a round ten that fits inside a.
    const jump = randomInt(rng, 1, Math.floor(a / 10)) * 10;
    return baseQuestion(ctx, "add_sub_tens", `${a} − ${jump} = ?`, a - jump);
  }
  const jump = randomInt(rng, 1, Math.floor((100 - a) / 10)) * 10;
  return baseQuestion(ctx, "add_sub_tens", `${a} + ${jump} = ?`, a + jump);
};

const tensTo100: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 37);
  const ten = randomInt(rng, 1, 9) * 10;
  const prompt = `${ten} + ? = 100`;
  return baseQuestion(ctx, "tens_to_100", prompt, 100 - ten);
};

function makeTable(table: number, typeId: string): QuestionGenerator {
  return (ctx) => {
    const rng = createPrng(ctx.seed + ctx.index * 41 + table);
    const multiplier = randomInt(rng, 1, 10);
    const prompt = `${table} × ${multiplier} = ?`;
    return baseQuestion(ctx, typeId, prompt, table * multiplier);
  };
}

const measureText: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 43);
  const scenarios = [
    () => {
      const a = randomInt(rng, 12, 35);
      const b = randomInt(rng, 8, 25);
      const v1 = pick(rng, TOY_VEHICLES);
      return {
        prompt: `Een ${v1} is ${a} cm lang en een racebaan is ${b} cm lang. Hoeveel cm zijn ze samen?`,
        answer: a + b,
      };
    },
    () => {
      const long = randomInt(rng, 30, 60);
      const short = randomInt(rng, 10, long - 5);
      const v1 = pick(rng, TOY_VEHICLES);
      return {
        prompt: `Een ${v1} is ${long} cm lang en een kart is ${short} cm lang. Hoeveel cm langer is de ${v1}?`,
        answer: long - short,
      };
    },
    () => {
      const bags = randomInt(rng, 2, 5);
      const item = pick(rng, KILO_ITEMS);
      return {
        prompt: `Een ${item} weegt 1 kg. ${pick(rng, RACERS)} koopt er ${bags}. Hoeveel kg is dat samen?`,
        answer: bags,
      };
    },
    () => {
      const w1 = randomInt(rng, 1, 4);
      const w2 = randomInt(rng, 1, 4);
      const item1 = pick(rng, KILO_ITEMS);
      const item2 = pick(rng, KILO_ITEMS);
      return {
        prompt: `Een ${item1} weegt ${w1} kg en een ${item2} weegt ${w2} kg. Hoeveel kg samen?`,
        answer: w1 + w2,
      };
    },
    () => {
      const cans = randomInt(rng, 2, 6);
      const { liquid, container } = pick(rng, LITER_LIQUIDS);
      return {
        prompt: `In een ${container} past 1 liter ${liquid}. ${pick(rng, RACERS)} vult er ${cans}. Hoeveel liter is dat?`,
        answer: cans,
      };
    },
    () => {
      const total = randomInt(rng, 5, 12);
      const poured = randomInt(rng, 1, total - 1);
      const { liquid, container } = pick(rng, LITER_LIQUIDS);
      return {
        prompt: `Er zit ${total} liter ${liquid} in een ${container}. Je giet er ${poured} liter uit. Hoeveel liter blijft over?`,
        answer: total - poured,
      };
    },
    () => {
      const perBottle = randomInt(rng, 2, 4);
      const bottles = randomInt(rng, 2, 5);
      const { liquid, container } = pick(rng, LITER_LIQUIDS);
      return {
        prompt: `Elke ${container} bevat ${perBottle} liter ${liquid}. Je hebt er ${bottles}. Hoeveel liter is dat?`,
        answer: perBottle * bottles,
      };
    },
    () => {
      const ruler = randomInt(rng, 2, 4) * 10;
      const count = randomInt(rng, 2, 4);
      return {
        prompt: `Een liniaal is ${ruler} cm. Je legt er ${count} achter elkaar. Hoeveel cm is dat?`,
        answer: ruler * count,
      };
    },
    () => {
      const table = randomInt(rng, 4, 8) * 10;
      const v1 = pick(rng, TOY_VEHICLES);
      return {
        prompt: `Een ${v1} is ${table} cm lang. Hoeveel cm moet erbij om 1 meter (100 cm) te halen?`,
        answer: 100 - table,
      };
    },
    () => {
      const buckets = randomInt(rng, 3, 7);
      const perBucket = 5;
      return {
        prompt: `Met een emmer schep je ${perBucket} liter uit het zwembad. ${pick(rng, RACERS)} vult ${buckets} emmers. Hoeveel liter is dat?`,
        answer: buckets * perBucket,
      };
    },
    () => {
      const jump = randomInt(rng, 2, 5) * 10;
      const jumps = randomInt(rng, 2, 4);
      return {
        prompt: `Op de meetlat spring je steeds ${jump} cm verder. Na ${jumps} sprongen vanaf 0 cm, waar ben je?`,
        answer: jump * jumps,
      };
    },
    () => {
      const apples = randomInt(rng, 3, 8);
      const perApple = randomInt(rng, 1, 2) * 100;
      return {
        prompt: `Eén appel weegt ${perApple} gram. ${pick(rng, RACERS)} weegt ${apples} even zware appels. Hoeveel gram is dat?`,
        answer: apples * perApple,
      };
    },
  ];
  const s = pickScenario(ctx.seed, ctx.index, 43, scenarios);
  return baseQuestion(ctx, "measure_text", s.prompt, s.answer);
};

const measureConvert: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 47);
  const scenarios = [
    () => {
      const dl = randomInt(rng, 2, 9);
      return {
        prompt: `Een beker bevat ${dl} deciliter. Hoeveel centiliter is dat? (1 dL = 10 cL)`,
        answer: dl * 10,
      };
    },
    () => {
      const meters = randomInt(rng, 1, 5);
      return {
        prompt: `Een springplank is ${meters} meter lang. Hoeveel centimeter is dat? (1 m = 100 cm)`,
        answer: meters * 100,
      };
    },
    () => {
      const cl = randomInt(rng, 2, 9) * 10;
      return {
        prompt: `Een flesje heeft ${cl} centiliter limonade. Hoeveel deciliter is dat? (10 cL = 1 dL)`,
        answer: cl / 10,
      };
    },
    () => {
      const dm = randomInt(rng, 3, 9);
      return {
        prompt: `Een stickerstrip is ${dm} decimeter. Hoeveel centimeter is dat? (1 dm = 10 cm)`,
        answer: dm * 10,
      };
    },
  ];
  const s = pickScenario(ctx.seed, ctx.index, 47, scenarios);
  return baseQuestion(ctx, "measure_convert", s.prompt, s.answer);
};

const measureStory: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 53);
  const scenarios = [
    () => {
      const cups = randomInt(rng, 3, 8);
      const perCup = randomInt(rng, 2, 4);
      const drink = pick(rng, DECILITER_DRINKS);
      const container = pick(rng, DECILITER_CONTAINERS);
      return {
        prompt: `Voor de pitstop vult ${pick(rng, RACERS)} ${cups} ${container}s met elk ${perCup} dL ${drink}. Hoeveel dL is dat samen?`,
        answer: cups * perCup,
      };
    },
    () => {
      const bottles = randomInt(rng, 2, 5);
      const perBottle = randomInt(rng, 2, 4);
      const container = pick(rng, DECILITER_CONTAINERS);
      return {
        prompt: `Elke ${container} bevat ${perBottle} dL water. ${pick(rng, RACERS)} drinkt ${bottles} ${container}s leeg. Hoeveel dL is dat?`,
        answer: bottles * perBottle,
      };
    },
    () => {
      const pieces = randomInt(rng, 4, 9);
      const perPiece = pick(rng, [5, 10, 20]);
      return {
        prompt: `Je bouwt een racebaan van stukken van ${perPiece} cm. Je gebruikt er ${pieces}. Hoeveel cm baan is dat?`,
        answer: pieces * perPiece,
      };
    },
    () => {
      const start = randomInt(rng, 20, 50);
      const added = randomInt(rng, 10, 30);
      const v1 = pick(rng, TOY_VEHICLES);
      return {
        prompt: `Een ${v1} is ${start} cm lang. Met een spoiler erbij wordt hij ${added} cm langer. Hoe lang is hij nu?`,
        answer: start + added,
      };
    },
  ];
  const s = pickScenario(ctx.seed, ctx.index, 53, scenarios);
  return baseQuestion(ctx, "measure_story", s.prompt, s.answer);
};

const moneyCents: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 59);
  const scenarios = [
    () => {
      const n20 = randomInt(rng, 1, 5);
      const n10 = randomInt(rng, 1, 4);
      return {
        prompt: `In je portemonnee zitten ${n20} munten van 20 cent en ${n10} munten van 10 cent. Hoeveel cent heb je?`,
        answer: n20 * 20 + n10 * 10,
      };
    },
    () => {
      const n50 = randomInt(rng, 1, 3);
      const n20 = randomInt(rng, 0, 3);
      const n10 = randomInt(rng, 1, 4);
      return {
        prompt: `Je spaart: ${n50}×50ct, ${n20}×20ct en ${n10}×10ct. Hoeveel cent is dat samen?`,
        answer: n50 * 50 + n20 * 20 + n10 * 10,
      };
    },
    () => {
      const price = randomInt(rng, 2, 6) * 25;
      const paid = price + randomInt(rng, 1, 3) * 25;
      return {
        prompt: `Een ${pick(rng, SHOP_ITEMS)} kost ${price} cent. ${pick(rng, RACERS)} betaalt met ${paid} cent. Hoeveel cent wisselgeld?`,
        answer: paid - price,
      };
    },
    () => {
      const target = randomInt(rng, 3, 8) * 10;
      const have = randomInt(rng, 1, target / 10 - 1) * 10;
      return {
        prompt: `${pick(rng, RACERS)} wil een ${pick(rng, SHOP_ITEMS)} van ${target} cent. Er is al ${have} cent gespaard. Hoeveel cent nog?`,
        answer: target - have,
      };
    },
    () => {
      const packs = randomInt(rng, 2, 5);
      const perPack = randomInt(rng, 2, 4) * 10;
      const item = pick(rng, SHOP_ITEMS);
      return {
        prompt: `Een ${item} kost ${perPack} cent. Je koopt er ${packs}. Hoeveel cent betaal je?`,
        answer: packs * perPack,
      };
    },
  ];
  const s = pickScenario(ctx.seed, ctx.index, 59, scenarios);
  return baseQuestion(ctx, "money_cents", s.prompt, s.answer);
};

const moneyMixed: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 61);
  const euros = randomInt(rng, 1, 3);
  const cents = randomInt(rng, 1, 8) * 10;
  const prompt = `${pick(rng, RACERS)} heeft ${euros} euro en ${cents} cent. Hoeveel cent is dat totaal?`;
  return baseQuestion(ctx, "money_mixed", prompt, euros * 100 + cents);
};

const moneyStory: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 67);
  const price = randomInt(rng, 2, 8) * 25;
  const paid = price + randomInt(rng, 1, 4) * 25;
  const prompt = `Een ${pick(rng, TOY_PRODUCTS)} kost ${price} cent. ${pick(rng, RACERS)} betaalt met ${paid} cent. Hoeveel cent wisselgeld?`;
  return baseQuestion(ctx, "money_story", prompt, paid - price);
};

function makeClockVisual(
  typeId: string,
  allowedMinutes: number[],
  seedOffset: number,
): QuestionGenerator {
  return (ctx) => {
    const rng = createPrng(ctx.seed + ctx.index * seedOffset);
    const hour = randomInt(rng, 1, 12);
    const minute = pickOne(rng, allowedMinutes);
    const prompt = pickOne(rng, [
      "Hoe laat is het op de klok?",
      "Kijk naar de klok. Hoe laat is het?",
      "Wat is de tijd op de klok?",
    ]);
    const typeConfig = getQuestionType(typeId);
    return {
      id: makeId(ctx, typeId),
      type: typeId,
      prompt,
      display: typeConfig.display ?? "clock",
      correctAnswer: hour * 100 + minute,
      acceptedAnswers: getAcceptedClockAnswers(hour, minute),
      timeMs: getQuestionTimeMs(ctx.baseTimeMs, typeId),
      visualData: {
        clockHour: hour,
        clockMinute: minute,
        clockStyle: pickOne(rng, ["analog", "digital"]),
      },
    };
  };
}

const clockHalfHour = makeClockVisual("clock_half_hour", [0, 30], 71);
const clockQuarter = makeClockVisual("clock_quarter", [0, 15, 30, 45], 73);
const clockVisual = makeClockVisual("clock_visual", [0, 15, 30, 45], 79);

const moneyVisual: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 83);
  const denominations = [5, 10, 20, 50];
  const count = randomInt(rng, 3, 6);
  const coins = Array.from({ length: count }, () => pick(rng, denominations)).sort(
    (a, b) => b - a,
  );
  const total = coins.reduce((a, b) => a + b, 0);
  return baseQuestion(
    ctx,
    "money_visual",
    "Tel het geld op de afbeelding. Hoeveel cent is het?",
    total,
    "money",
    { coins },
  );
};

const measureVisual: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 89);
  // The maatbeker shows graduations but NOT the answer; the child reads the
  // water level off the scale. Vary the scale max so it isn't memorizable.
  const max = pick(rng, [10, 12, 20]);
  // Pick a level that lands on a readable graduation but isn't always a label.
  const value = randomInt(rng, 2, max - 1);
  const drink = pick(rng, DECILITER_DRINKS);
  return baseQuestion(
    ctx,
    "measure_visual",
    `Lees de maatbeker af. Hoeveel liter ${drink} zit erin?`,
    value,
    "measure",
    { measureValue: value, measureMax: max, measureUnit: "L", measureTarget: "beaker" },
  );
};

const durationMinutes: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 97);
  const startH = randomInt(rng, 8, 16);
  const startM = pickOne(rng, [0, 15, 30, 45]);
  const duration = pickOne(rng, [15, 30, 45, 60, 90]);
  const endTotal = startH * 60 + startM + duration;
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;
  const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
  // The child must compute the gap between the two clock times.
  const prompt = `De race begint om ${fmt(startH, startM)} en eindigt om ${fmt(endH, endM)}. Hoeveel minuten duurt de race?`;
  return baseQuestion(ctx, "duration_minutes", prompt, duration);
};

const skipCount7: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 101);
  const jumps = randomInt(rng, 2, 7);
  const prompt = `${jumps} sprongen van 7. Waar kom je? (begin bij 0)`;
  return baseQuestion(ctx, "skip_count_7", prompt, jumps * 7);
};

const skipCount9: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 103);
  const jumps = randomInt(rng, 2, 8);
  const prompt = `${jumps} sprongen van 9 vanaf 0. Waar kom je?`;
  return baseQuestion(ctx, "skip_count_9", prompt, jumps * 9);
};

const skipCount100: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 107);
  const jumps = randomInt(rng, 1, 5);
  const start = randomInt(rng, 1, 4) * 100;
  const prompt = `Start bij ${start}. ${jumps} sprongen van 100 vooruit. Waar kom je?`;
  return baseQuestion(ctx, "skip_count_100", prompt, start + jumps * 100);
};

const skipCount10_100: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 109);
  const start = randomInt(rng, 1, 9);
  const jumps = randomInt(rng, 2, 6);
  const prompt = `Start bij ${start}. ${jumps} sprongen van 10. Waar kom je?`;
  return baseQuestion(ctx, "skip_count_10_100", prompt, start + jumps * 10);
};

// "Tabel aflezen": read a value from a multiplication-table sequence where one
// term is hidden, e.g. 6, 12, ?, 24 -> 18.
const tableRead: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 113);
  const table = pickOne(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const startK = randomInt(rng, 1, 5);
  const terms = [startK, startK + 1, startK + 2, startK + 3];
  const gapPos = randomInt(rng, 0, 3);
  const shown = terms
    .map((k, i) => (i === gapPos ? "?" : String(table * k)))
    .join(", ");
  const prompt = `Tafel van ${table}: ${shown}. Welk getal hoort op de plek van het vraagteken?`;
  return baseQuestion(ctx, "table_read", prompt, table * terms[gapPos]!);
};

// "Tabel invullen": fill in the missing factor, e.g. 4 × ? = 28.
const tableFillGap: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 127);
  const table = pickOne(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const multiplier = randomInt(rng, 2, 10);
  const product = table * multiplier;
  const hideFirst = rng() > 0.5;
  const prompt = hideFirst
    ? `? × ${multiplier} = ${product}`
    : `${table} × ? = ${product}`;
  return baseQuestion(ctx, "table_fill_gap", prompt, hideFirst ? table : multiplier);
};

export const generators: Record<string, QuestionGenerator> = {
  add_sub_30: addSub30,
  add_sub_100: addSub100,
  add_sub_from_ten: addSubFromTen,
  add_sub_tens: addSubTens,
  tens_to_100: tensTo100,
  table_2: makeTable(2, "table_2"),
  table_3: makeTable(3, "table_3"),
  table_4: makeTable(4, "table_4"),
  table_5: makeTable(5, "table_5"),
  table_6: makeTable(6, "table_6"),
  table_8: makeTable(8, "table_8"),
  table_10: makeTable(10, "table_10"),
  table_1: makeTable(1, "table_1"),
  table_mult: (ctx) => {
    const rng = createPrng(ctx.seed + ctx.index * 117);
    const table = pickOne(rng, [2, 3, 4, 5, 6, 8, 9, 10]);
    return makeTable(table, "table_mult")(ctx);
  },
  measure_text: measureText,
  measure_convert: measureConvert,
  measure_story: measureStory,
  measure_visual: measureVisual,
  money_cents: moneyCents,
  money_mixed: moneyMixed,
  money_story: moneyStory,
  money_visual: moneyVisual,
  clock_half_hour: clockHalfHour,
  clock_quarter: clockQuarter,
  clock_visual: clockVisual,
  duration_minutes: durationMinutes,
  skip_count_7: skipCount7,
  skip_count_9: skipCount9,
  skip_count_100: skipCount100,
  skip_count_10_100: skipCount10_100,
  table_read: tableRead,
  table_fill_gap: tableFillGap,
};
