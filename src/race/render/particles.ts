export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  emitDust(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 5,
        vx: -2 - Math.random() * 3,
        vy: -1 - Math.random() * 2,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        color: "rgba(180,140,80,0.7)",
        size: 2 + Math.random() * 3,
      });
    }
  }

  emitBoost(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        vx: -4 - Math.random() * 6,
        vy: (Math.random() - 0.5) * 4,
        life: 12 + Math.random() * 8,
        maxLife: 20,
        color: i % 2 === 0 ? "#FF6B00" : "#FFE600",
        size: 3 + Math.random() * 4,
      });
    }
  }

  emitConfetti(x: number, y: number) {
    const colors = ["#FF6B00", "#FFE600", "#22C55E", "#0072CE", "#DA291C"];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -3 - Math.random() * 5,
        life: 40 + Math.random() * 30,
        maxLife: 70,
        color: colors[i % colors.length]!,
        size: 4 + Math.random() * 3,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
