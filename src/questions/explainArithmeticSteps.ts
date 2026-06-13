/** Parse plain sum prompts like `12 + 5 = ?` or `40 − 12 = ?`. */
export function parseSimpleSumPrompt(prompt: string):
  | { op: "add"; a: number; b: number }
  | { op: "sub"; a: number; b: number }
  | { op: "addMissing"; a: number; total: number }
  | null {
  const add = prompt.match(/^(\d+)\s*\+\s*(\d+)\s*=\s*\?$/);
  if (add) return { op: "add", a: Number(add[1]), b: Number(add[2]) };

  const sub = prompt.match(/^(\d+)\s*([−-])\s*(\d+)\s*=\s*\?$/);
  if (sub) return { op: "sub", a: Number(sub[1]), b: Number(sub[3]) };

  const missing = prompt.match(/^(\d+)\s*\+\s*\?\s*=\s*(\d+)$/);
  if (missing) {
    return {
      op: "addMissing",
      a: Number(missing[1]),
      total: Number(missing[2]),
    };
  }

  return null;
}

function explainAdditionSteps(a: number, b: number): string[] {
  const steps: string[] = [];
  const onesA = a % 10;
  const toTen = onesA === 0 ? 0 : 10 - onesA;

  if (toTen > 0 && b > toTen) {
    const mid = a + toTen;
    const rest = b - toTen;
    steps.push(`${a} + ${toTen} = ${mid}`);
    if (rest > 0) steps.push(`${mid} + ${rest} = ${a + b}`);
  } else {
    steps.push(`${a} + ${b} = ${a + b}`);
  }
  return steps;
}

function explainSubtractionSteps(hi: number, lo: number): string[] {
  const steps: string[] = [];
  let x = hi;
  const loTens = Math.floor(lo / 10) * 10;
  const loOnes = lo % 10;

  if (loTens > 0) {
    steps.push(`${x} − ${loTens} = ${x - loTens}`);
    x -= loTens;
  }

  if (loOnes > 0) {
    const onesInX = x % 10;
    if (onesInX >= loOnes) {
      steps.push(`${x} − ${loOnes} = ${x - loOnes}`);
    } else {
      if (onesInX > 0) {
        steps.push(`${x} − ${onesInX} = ${x - onesInX}`);
        x -= onesInX;
      }
      const rest = loOnes - onesInX;
      if (rest > 0) steps.push(`${x} − ${rest} = ${x - rest}`);
    }
  }

  if (steps.length === 0) steps.push(`${hi} − ${lo} = ${hi - lo}`);
  return steps;
}

function formatSteps(steps: string[]): string {
  const lines = steps.map((s, i) => `${i + 1}. ${s}`);
  return `Tel stap voor stap:\n${lines.join("\n")}`;
}

/** Explanation with intermediate steps for + / − sums. */
export function explainArithmeticSteps(prompt: string): string | null {
  const parsed = parseSimpleSumPrompt(prompt.trim());
  if (!parsed) return null;

  if (parsed.op === "add") {
    return formatSteps(explainAdditionSteps(parsed.a, parsed.b));
  }
  if (parsed.op === "sub") {
    return formatSteps(explainSubtractionSteps(parsed.a, parsed.b));
  }
  const missing = parsed.total - parsed.a;
  return formatSteps(explainAdditionSteps(parsed.a, missing));
}

export function isAddSubQuestionType(type: string): boolean {
  return (
    type.startsWith("add_sub") ||
    type === "tens_to_100"
  );
}
