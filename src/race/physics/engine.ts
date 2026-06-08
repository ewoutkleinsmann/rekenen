import Matter from "matter-js";
import { GRAVITY } from "./constants";

export function createRaceEngine() {
  const engine = Matter.Engine.create({ gravity: { x: 0, y: GRAVITY } });
  engine.timing.timeScale = 1;
  return engine;
}

export function stepEngine(engine: Matter.Engine, dt = 1000 / 60) {
  Matter.Engine.update(engine, dt);
}
