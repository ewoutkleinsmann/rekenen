import { getCarImage } from "./preload";

const FALLBACK_COLORS: Record<string, { body: string; accent: string }> = {
  "booster-blaze": { body: "#FF2D00", accent: "#FFE600" },
  "grip-gt": { body: "#0072CE", accent: "#FFE600" },
  "jump-jet": { body: "#FFE600", accent: "#DA291C" },
  "loop-king": { body: "#9B59B6", accent: "#FFE600" },
  "rocket-racer": { body: "#2ECC71", accent: "#DA291C" },
};

export function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  velocity: number,
  carId: string,
  boosting: boolean,
) {
  ctx.save();
  ctx.translate(x, y - 6);
  ctx.rotate(angle);

  if (velocity > 20) {
    drawSpeedLines(ctx, velocity, boosting);
  }

  if (boosting) {
    ctx.fillStyle = "rgba(255, 100, 0, 0.7)";
    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-55 - velocity * 0.15, 0);
    ctx.lineTo(-38, -2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = getCarImage(carId);
  if (img) {
    const w = 90;
    const h = 36;
    ctx.drawImage(img, -w / 2, -h / 2 - 4, w, h);
  } else {
    drawFallbackCar(ctx, carId);
  }

  ctx.restore();
}

function drawFallbackCar(ctx: CanvasRenderingContext2D, carId: string) {
  const colors = FALLBACK_COLORS[carId] ?? FALLBACK_COLORS["booster-blaze"]!;
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(-40, 4);
  ctx.lineTo(-30, -14);
  ctx.lineTo(30, -12);
  ctx.lineTo(42, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  velocity: number,
  boosting: boolean,
) {
  const count = Math.min(6, Math.floor(velocity / 15));
  ctx.strokeStyle = boosting ? "#FFE600" : "rgba(255,230,0,0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const len = 12 + i * 8;
    const yOff = (i - count / 2) * 6;
    ctx.beginPath();
    ctx.moveTo(-35, yOff);
    ctx.lineTo(-35 - len, yOff);
    ctx.stroke();
  }
}
