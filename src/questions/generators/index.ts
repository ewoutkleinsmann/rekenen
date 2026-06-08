import type { QuestionGenerator } from "../types";
import { createPrng, randomInt, pickOne } from "../prng";
import { getQuestionTimeMs } from "../../quiz/time";
import { getQuestionType } from "../../config/loadConfig";

function makeId(ctx: { seed: number; index: number }, type: string): string {
  return `${type}-${ctx.seed}-${ctx.index}`;
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
  const subtract = rng() > 0.5;
  const prompt = subtract ? `${a} − ${b} = ?` : `${a} + ${b} = ?`;
  const correctAnswer = subtract ? a - b : a + b;
  return baseQuestion(ctx, "add_sub_30", prompt, correctAnswer);
};

const addSub100: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 19);
  const a = randomInt(rng, 10, 100);
  const b = randomInt(rng, 1, 40);
  const subtract = rng() > 0.5;
  const prompt = subtract ? `${a} − ${b} = ?` : `${a} + ${b} = ?`;
  return baseQuestion(ctx, "add_sub_100", prompt, subtract ? a - b : a + b);
};

const addSub1000: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 23);
  const a = randomInt(rng, 100, 1000);
  const b = randomInt(rng, 10, 200);
  const subtract = rng() > 0.5;
  const prompt = subtract ? `${a} − ${b} = ?` : `${a} + ${b} = ?`;
  return baseQuestion(ctx, "add_sub_1000", prompt, subtract ? a - b : a + b);
};

const addSubFromTen: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 29);
  const ten = randomInt(rng, 1, 9) * 10;
  const n = randomInt(rng, 1, 9);
  const subtract = rng() > 0.5;
  const prompt = subtract ? `${ten} − ${n} = ?` : `${ten} + ${n} = ?`;
  return baseQuestion(
    ctx,
    "add_sub_from_ten",
    prompt,
    subtract ? ten - n : ten + n,
  );
};

const addSubTens: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 31);
  const a = randomInt(rng, 2, 9) * 10 + randomInt(rng, 0, 9);
  const jump = randomInt(rng, 1, 5) * 10;
  const subtract = rng() > 0.5;
  const prompt = subtract ? `${a} − ${jump} = ?` : `${a} + ${jump} = ?`;
  return baseQuestion(
    ctx,
    "add_sub_tens",
    prompt,
    subtract ? a - jump : a + jump,
  );
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
      const jugs = randomInt(rng, 2, 5);
      return {
        prompt: `Een emmer is 5 liter. ${jugs} emmers = ? liter`,
        answer: jugs * 5,
      };
    },
    () => {
      const packs = randomInt(rng, 2, 6);
      return {
        prompt: `Een pak melk is 1 liter. ${packs} pakken = ? liter`,
        answer: packs,
      };
    },
    () => {
      const cm = randomInt(rng, 2, 8) * 10;
      return {
        prompt: `Een liniaal is ${cm} cm. 2 linialen = ? cm`,
        answer: cm * 2,
      };
    },
  ];
  const s = pickOne(rng, scenarios)();
  return baseQuestion(ctx, "measure_text", s.prompt, s.answer);
};

const measureConvert: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 47);
  const dl = randomInt(rng, 2, 9);
  const prompt = `${dl} dL = ? cL (1 dL = 10 cL)`;
  return baseQuestion(ctx, "measure_convert", prompt, dl * 10);
};

const measureStory: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 53);
  const cups = randomInt(rng, 3, 8);
  const perCup = 2;
  const prompt = `Je vult ${cups} kopjes met elk ${perCup} dL water. Hoeveel dL is dat samen?`;
  return baseQuestion(ctx, "measure_story", prompt, cups * perCup);
};

const moneyCents: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 59);
  const coins = [randomInt(rng, 1, 5), randomInt(rng, 1, 4)];
  const values = [20, 10];
  const total = coins[0]! * values[0]! + coins[1]! * values[1]!;
  const prompt = `Je hebt ${coins[0]}×20ct en ${coins[1]}×10ct. Hoeveel cent is dat?`;
  return baseQuestion(ctx, "money_cents", prompt, total);
};

const moneyMixed: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 61);
  const euros = randomInt(rng, 1, 3);
  const cents = randomInt(rng, 1, 8) * 10;
  const prompt = `Je hebt ${euros} euro en ${cents} cent. Hoeveel cent is dat totaal?`;
  return baseQuestion(ctx, "money_mixed", prompt, euros * 100 + cents);
};

const moneyStory: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 67);
  const price = randomInt(rng, 2, 8) * 25;
  const paid = price + randomInt(rng, 1, 4) * 25;
  const prompt = `Een Hot Wheels auto kost ${price} cent. Je betaalt met ${paid} cent. Hoeveel cent wisselgeld krijg je?`;
  return baseQuestion(ctx, "money_story", prompt, paid - price);
};

const clockHalfHour: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 71);
  const hour = randomInt(rng, 1, 12);
  const half = rng() > 0.5;
  const minute = half ? 30 : 0;
  const prompt = half
    ? `De klok wijst ${hour} uur half. Hoe laat is het? (schrijf als HHMM, bv. 930)`
    : `De klok wijst ${hour} uur. Hoe laat is het? (schrijf als HHMM, bv. 900)`;
  const answer = hour * 100 + minute;
  return baseQuestion(ctx, "clock_half_hour", prompt, answer);
};

const clockQuarter: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 73);
  const hour = randomInt(rng, 1, 12);
  const quarters = [0, 15, 30, 45];
  const minute = pickOne(rng, quarters);
  const prompt = `Hoe laat is het als de minutenwijzer op ${minute} staat en het is ${hour} uur? (HHMM)`;
  return baseQuestion(ctx, "clock_quarter", prompt, hour * 100 + minute);
};

const clockVisual: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 79);
  const hour = randomInt(rng, 1, 12);
  const minute = pickOne(rng, [0, 15, 30, 45]);
  return baseQuestion(
    ctx,
    "clock_visual",
    "Hoe laat is het op de klok? (HHMM)",
    hour * 100 + minute,
    "clock",
    {
      clockHour: hour,
      clockMinute: minute,
      clockStyle: pickOne(rng, ["analog", "digital"]),
    },
  );
};

const moneyVisual: QuestionGenerator = (ctx) => {
  const coins = [20, 20, 10, 5, 5];
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
  const value = randomInt(rng, 3, 9);
  return baseQuestion(
    ctx,
    "measure_visual",
    "Hoeveel liter water zit er in het glas?",
    value,
    "measure",
    { measureValue: value, measureUnit: "L", measureTarget: "glass" },
  );
};

const durationMinutes: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 97);
  const startH = randomInt(rng, 8, 14);
  const duration = pickOne(rng, [15, 30, 45, 60]);
  const prompt = `Je begint om ${startH}:00 met racen. Je stopt ${duration} minuten later. Hoeveel minuten heb je geracet?`;
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

const tableRead: QuestionGenerator = (ctx) => {
  const rng = createPrng(ctx.seed + ctx.index * 113);
  const dice = [
    randomInt(rng, 1, 6),
    randomInt(rng, 1, 6),
    randomInt(rng, 1, 6),
  ];
  const max = Math.max(...dice);
  const prompt = `Dobbelsteen worpen: ${dice.join(", ")}. Wat is het hoogste aantal ogen?`;
  return baseQuestion(ctx, "table_read", prompt, max);
};

export const generators: Record<string, QuestionGenerator> = {
  add_sub_30: addSub30,
  add_sub_100: addSub100,
  add_sub_1000: addSub1000,
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
  table_fill_gap: tableRead,
};
