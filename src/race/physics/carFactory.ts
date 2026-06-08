import Matter from "matter-js";
import type { EffectiveStats } from "../../garage/stats";
import {
  CAR_HEIGHT,
  CAR_WIDTH,
  DRIVE_FORCE,
  FRICTION_BASE,
  MAX_SPEED_FACTOR,
  WHEEL_RADIUS,
} from "./constants";

export interface CarSetup {
  body: Matter.Body;
  maxSpeed: number;
  driveForce: number;
  grip: number;
  stats: EffectiveStats;
}

export function createCarBody(
  stats: EffectiveStats,
  startX: number,
  startY: number,
): CarSetup {
  const mass = stats.weight / 10;
  const grip = stats.grip / 100;
  const maxSpeed = stats.speed * MAX_SPEED_FACTOR;
  const driveForce = stats.acceleration * DRIVE_FORCE;

  const chassis = Matter.Bodies.rectangle(
    startX,
    startY - CAR_HEIGHT,
    CAR_WIDTH,
    CAR_HEIGHT,
    {
      friction: FRICTION_BASE + grip * 0.06,
      frictionAir: 0.01,
      restitution: 0.05,
      density: mass / (CAR_WIDTH * CAR_HEIGHT),
      label: "car",
    },
  );

  const rearWheel = Matter.Bodies.circle(
    startX - CAR_WIDTH * 0.28,
    startY - WHEEL_RADIUS,
    WHEEL_RADIUS,
    {
      friction: 0.9 + grip * 0.05,
      density: mass / 400,
      label: "wheel",
    },
  );

  const frontWheel = Matter.Bodies.circle(
    startX + CAR_WIDTH * 0.28,
    startY - WHEEL_RADIUS,
    WHEEL_RADIUS,
    {
      friction: 0.9 + grip * 0.05,
      density: mass / 400,
      label: "wheel",
    },
  );

  const body = Matter.Body.create({
    parts: [chassis, rearWheel, frontWheel],
    label: "car",
  });

  Matter.Body.setAngle(body, 0);

  return { body, maxSpeed, driveForce, grip, stats };
}

export function applyDriveForce(
  car: CarSetup,
  angle: number,
  onGround: boolean,
) {
  if (!onGround) return;

  const speed = Math.hypot(car.body.velocity.x, car.body.velocity.y);
  if (speed >= car.maxSpeed) return;

  const fx = Math.cos(angle) * car.driveForce;
  const fy = Math.sin(angle) * car.driveForce;
  Matter.Body.applyForce(car.body, car.body.position, { x: fx, y: fy });
}

export function capSpeed(car: CarSetup) {
  const { x, y } = car.body.velocity;
  const speed = Math.hypot(x, y);
  if (speed > car.maxSpeed) {
    const scale = car.maxSpeed / speed;
    Matter.Body.setVelocity(car.body, { x: x * scale, y: y * scale });
  }
}

export function applyBoost(car: CarSetup, multiplier: number, angle: number) {
  const boostFactor = 1 + (car.stats.boost / 100) * (multiplier - 1);
  const impulse = boostFactor * 0.015;
  Matter.Body.applyForce(car.body, car.body.position, {
    x: Math.cos(angle) * impulse,
    y: Math.sin(angle) * impulse,
  });
}

export function getCarSpeed(body: Matter.Body): number {
  return Math.hypot(body.velocity.x, body.velocity.y) * 60;
}

export function isOnGround(body: Matter.Body, groundY: number): boolean {
  return body.position.y >= groundY - 30;
}

export function alignToPath(
  body: Matter.Body,
  target: { x: number; y: number; angle: number },
  strength = 0.15,
) {
  const dx = target.x - body.position.x;
  const dy = target.y - body.position.y;
  Matter.Body.applyForce(body, body.position, {
    x: dx * strength * body.mass * 0.001,
    y: dy * strength * body.mass * 0.001,
  });

  const angleDiff = target.angle - body.angle;
  const torque = angleDiff * 0.002 * body.mass;
  Matter.Body.setAngularVelocity(body, body.angularVelocity + torque);
}
