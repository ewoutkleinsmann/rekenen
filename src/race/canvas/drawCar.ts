import { CAR_COLORS, COLORS } from "./colors";

export function drawCar(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  velocity: number,
  carId: string,
) {
  const colors = CAR_COLORS[carId] ?? CAR_COLORS["booster-blaze"]!;

  drawSpeedLines(ctx, px, py, velocity);

  const w = 28;
  const h = 14;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(px, py + 6, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.ellipse(px - 10, py + 5, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + 10, py + 5, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(px - w / 2, py);
  ctx.lineTo(px - w / 2 + 6, py - h);
  ctx.lineTo(px + w / 2 - 4, py - h + 2);
  ctx.lineTo(px + w / 2, py);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(135,206,235,0.6)";
  ctx.fillRect(px + 2, py - h + 3, 8, 5);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(px - 8, py - 4, 16, 2);
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  velocity: number,
) {
  if (velocity < 15) return;
  const count = Math.min(5, Math.floor(velocity / 20));
  ctx.strokeStyle = COLORS.speedLine;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < count; i++) {
    const len = 10 + i * 6;
    const yOff = (i - count / 2) * 5;
    ctx.beginPath();
    ctx.moveTo(px - 20, py - 4 + yOff);
    ctx.lineTo(px - 20 - len, py - 4 + yOff);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
