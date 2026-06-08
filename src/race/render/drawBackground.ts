const COLORS = {
  skyTop: "#009CDE",
  skyMid: "#5BB5E8",
  skyBottom: "#87CEEB",
  hillFar: "#1a5a8a",
  hillNear: "#0f3460",
  cloud: "rgba(255,255,255,0.28)",
  pylon: "#555",
};

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  viewW: number,
  viewH: number,
  worldMinY: number,
) {
  const grad = ctx.createLinearGradient(
    0,
    worldMinY - 200,
    0,
    worldMinY + viewH,
  );
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(0.55, COLORS.skyMid);
  grad.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(camX, worldMinY - 200, viewW, viewH + 400);

  ctx.fillStyle = COLORS.hillFar;
  ctx.beginPath();
  ctx.moveTo(camX, worldMinY + 60);
  for (let i = 0; i <= 8; i++) {
    const x = camX + (viewW * i) / 8;
    const y = worldMinY + 40 + Math.sin(i * 1.2 + camX * 0.002) * 30;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(camX + viewW, worldMinY + 200);
  ctx.lineTo(camX, worldMinY + 200);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.hillNear;
  ctx.beginPath();
  ctx.moveTo(camX, worldMinY + 80);
  for (let i = 0; i <= 10; i++) {
    const x = camX + (viewW * i) / 10;
    const y = worldMinY + 70 + Math.sin(i * 0.9 + camX * 0.003 + 1) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(camX + viewW, worldMinY + 200);
  ctx.lineTo(camX, worldMinY + 200);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.cloud;
  for (let i = 0; i < 4; i++) {
    const cx = camX + ((i * 280 + camX * 0.15) % (viewW + 200)) - 50;
    const cy = worldMinY - 60 + (i % 2) * 25;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = COLORS.pylon;
  ctx.lineWidth = 3;
  for (let i = 0; i < Math.ceil(viewW / 120) + 2; i++) {
    const px = camX + i * 120 - (camX % 120);
    ctx.beginPath();
    ctx.moveTo(px, worldMinY + 30);
    ctx.lineTo(px, worldMinY - 40);
    ctx.stroke();
    ctx.fillStyle = "#DA291C";
    ctx.fillRect(px - 6, worldMinY - 50, 12, 8);
  }
}
