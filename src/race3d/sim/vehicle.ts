import RAPIER from "@dimforge/rapier3d-compat";
import type { Track3D } from "./buildTrack3d";
import { CAR_HALF, SIM_GRAVITY } from "./simConstants";
import type { Quat, Vec3 } from "./vec3";

let initPromise: Promise<void> | null = null;

/** Initialise the rapier WASM module exactly once. */
export function ensureRapier(): Promise<void> {
  if (!initPromise) {
    initPromise = RAPIER.init();
  }
  return initPromise;
}

export interface PhysicsWorld {
  world: RAPIER.World;
  car: RAPIER.RigidBody;
  step: (pos: Vec3, quat: Quat) => void;
  read: () => { pos: Vec3; quat: Quat };
  free: () => void;
}

/**
 * Builds a deterministic rapier world containing the track colliders and a
 * kinematic car body. The car is driven along the precomputed trajectory each
 * step, so the simulation stays robust and reproducible while still running a
 * real physics world (collisions, contacts) that can be extended later.
 */
export function createPhysicsWorld(track: Track3D, start: Vec3): PhysicsWorld {
  const world = new RAPIER.World({ x: 0, y: SIM_GRAVITY, z: 0 });
  world.timestep = 1 / 60;

  for (const spec of track.colliders) {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(spec.center[0], spec.center[1], spec.center[2])
        .setRotation({
          x: spec.quat[0],
          y: spec.quat[1],
          z: spec.quat[2],
          w: spec.quat[3],
        }),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        spec.halfExtents[0],
        spec.halfExtents[1],
        spec.halfExtents[2],
      ).setFriction(1.0),
      body,
    );
  }

  const car = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      start[0],
      start[1],
      start[2],
    ),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(CAR_HALF[0], CAR_HALF[1], CAR_HALF[2]),
    car,
  );

  return {
    world,
    car,
    step(pos, quat) {
      car.setNextKinematicTranslation({ x: pos[0], y: pos[1], z: pos[2] });
      car.setNextKinematicRotation({
        x: quat[0],
        y: quat[1],
        z: quat[2],
        w: quat[3],
      });
      world.step();
    },
    read() {
      const t = car.translation();
      const r = car.rotation();
      return { pos: [t.x, t.y, t.z], quat: [r.x, r.y, r.z, r.w] };
    },
    free() {
      world.free();
    },
  };
}
