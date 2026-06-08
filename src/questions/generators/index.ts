import type { QuestionGenerator } from "../types";
import { createPrng, randomInt, pickOne, pickScenario } from "../prng";
import { getQuestionTimeMs } from "../../quiz/time";
import { getQuestionType } from "../../config/loadConfig";
import { getAcceptedClockAnswers } from "../clockAnswer";

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
      const a = randomInt(rng, 12, 35);
      const b = randomInt(rng, 8, 25);
      return {
        prompt: `Een speelgoedauto is ${a} cm lang en een racebaan is ${b} cm lang. Hoeveel cm zijn ze samen?`,
        answer: a + b,
      };
    },
    () => {
      const long = randomInt(rng, 30, 60);
      const short = randomInt(rng, 10, long - 5);
      return {
        prompt: `Een tafel is ${long} cm lang en een stoel is ${short} cm breed. Hoeveel cm langer is de tafel?`,
        answer: long - short,
      };
    },
    () => {
      const bags = randomInt(rng, 2, 5);
      return {
        prompt: `Een zak suiker weegt 1 kg. Je koopt ${bags} zakken. Hoeveel kg is dat samen?`,
        answer: bags,
      };
    },
    () => {
      const milk = 1;
      const fruit = randomInt(rng, 1, 3);
      return {
        prompt: `Een pak melk weegt ${milk} kg en een mandarijnenzak weegt ${fruit} kg. Hoeveel kg samen?`,
        answer: milk + fruit,
      };
    },
    () => {
      const cans = randomInt(rng, 2, 6);
      return {
        prompt: `In een kannetje past 1 liter water. Je vult ${cans} kannetjes voor de wasstraat. Hoeveel liter is dat?`,
        answer: cans,
      };
    },
    () => {
      const total = randomInt(rng, 5, 12);
      const poured = randomInt(rng, 1, total - 1);
      return {
        prompt: `Je hebt ${total} liter water in een emmer. Je giet ${poured} liter in een gieter. Hoeveel liter blijft over?`,
        answer: total - poured,
      };
    },
    () => {
      const perBottle = randomInt(rng, 2, 4);
      const bottles = randomInt(rng, 2, 5);
      return {
        prompt: `Elke fles race-olie bevat ${perBottle} liter. Je hebt ${bottles} flessen. Hoeveel liter olie is dat?`,
        answer: perBottle * bottles,
      };
    },
    () => {
      const ruler = randomInt(rng, 2, 4) * 10;
      const count = randomInt(rng, 2, 4);
      return {
        prompt: `Een liniaal is ${ruler} cm. Je legt ${count} linialen achter elkaar. Hoeveel cm is dat?`,
        answer: ruler * count,
      };
    },
    () => {
      const table = randomInt(rng, 4, 8) * 10;
      return {
        prompt: `Een tafel is ${table} cm breed. Hoeveel cm moet je erbij doen om 1 meter (100 cm) te krijgen?`,
        answer: 100 - table,
      };
    },
    () => {
      const buckets = randomInt(rng, 3, 7);
      const perBucket = 5;
      return {
        prompt: `Met een emmer schep je ${perBucket} liter uit het zwembad. Je vult ${buckets} emmers. Hoeveel liter is dat?`,
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
        prompt: `Een appel weegt ongeveer ${perApple} gram. Je weegt ${apples} appels (allemaal even zwaar). Hoeveel gram is dat?`,
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
      const perCup = 2;
      return {
        prompt: `Voor de pitstop vul je ${cups} bekers met elk ${perCup} dL sportdrank. Hoeveel dL is dat samen?`,
        answer: cups * perCup,
      };
    },
    () => {
      const bottles = randomInt(rng, 2, 5);
      const perBottle = 3;
      return {
        prompt: `Elke bidon bevat ${perBottle} dL water. De coureur drinkt ${bottles} bidons leeg. Hoeveel dL drinkt hij?`,
        answer: bottles * perBottle,
      };
    },
    () => {
      const pieces = randomInt(rng, 4, 9);
      const perPiece = 10;
      return {
        prompt: `Je bouwt een racebaan van stukken van ${perPiece} cm. Je gebruikt ${pieces} stukken. Hoeveel cm baan is dat?`,
        answer: pieces * perPiece,
      };
    },
    () => {
      const start = randomInt(rng, 20, 50);
      const added = randomInt(rng, 10, 30);
      return {
        prompt: `Een auto is ${start} cm lang. Met een spoiler erbij wordt hij ${added} cm langer. Hoe lang is de auto nu?`,
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
        prompt: `Een sticker kost ${price} cent. Je betaalt met ${paid} cent. Hoeveel cent wisselgeld krijg je?`,
        answer: paid - price,
      };
    },
    () => {
      const target = randomInt(rng, 3, 8) * 10;
      const have = randomInt(rng, 1, target / 10 - 1) * 10;
      return {
        prompt: `Je wilt ${target} cent sparen. Je hebt al ${have} cent. Hoeveel cent moet je er nog bij sparen?`,
        answer: target - have,
      };
    },
    () => {
      const packs = randomInt(rng, 2, 5);
      const perPack = randomInt(rng, 2, 4) * 10;
      return {
        prompt: `Een pak gum kost ${perPack} cent. Je koopt ${packs} pakken. Hoeveel cent betaal je?`,
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
