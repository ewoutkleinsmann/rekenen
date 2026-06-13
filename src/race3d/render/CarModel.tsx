import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getCarModel, CAR_LENGTH, type CarModelDef } from "./carModels";
import { prepareGlbScene } from "./glbCar";
import { sampleReplay, makeSampledState } from "./sampleReplay";
import type { RaceReplay } from "../sim/types";
import type { PlaybackRef } from "./playback";
import { raceProgress } from "./playback";

interface Props {
  carId?: string;
  replay: RaceReplay;
  playback: PlaybackRef;
}

const WHEEL_RADIUS = 0.55;
const WHEEL_WIDTH = 0.4;

export function CarModel({ carId, replay, playback }: Props) {
  const model = getCarModel(carId);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const wheelRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];
  const steerRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const state = useMemo(makeSampledState, []);

  useEffect(() => {
    if (model.glb) preloadCarModel(model);
  }, [model.glb]);

  useFrame(() => {
    const pb = playback.current;
    const progress = raceProgress(pb);
    sampleReplay(replay, progress, state);

    if (root.current) {
      root.current.position.copy(state.pos);
      root.current.quaternion.copy(state.quat);
    }
    // Spin all wheels; steer the front pair.
    for (const w of wheelRefs) {
      if (w.current) w.current.rotation.x = -state.wheelSpin;
    }
    for (const s of steerRefs) {
      if (s.current) s.current.rotation.y = state.steer;
    }
    // Body lean into the corner and squat under acceleration.
    if (body.current) {
      body.current.rotation.z = THREE.MathUtils.lerp(
        body.current.rotation.z,
        -state.steer * 0.5,
        0.2,
      );
    }
    if (flame.current) {
      const f = state.boosting ? 1 : 0.001;
      flame.current.scale.set(1, 1, f * (1.4 + Math.random() * 0.5));
      flame.current.visible = state.boosting;
    }
  });

  return (
    <group ref={root}>
      {model.glb ? (
        <GLBCar
          url={model.glb}
          rotationY={model.rotationY}
          bodyRef={body}
          flameRef={flame}
        />
      ) : (
        <ProceduralCar
          model={model}
          bodyRef={body}
          flameRef={flame}
          wheelRefs={wheelRefs}
          steerRefs={steerRefs}
        />
      )}
    </group>
  );
}

function GLBCar({
  url,
  rotationY = 0,
  bodyRef,
  flameRef,
}: {
  url: string;
  rotationY?: number;
  bodyRef: React.RefObject<THREE.Group | null>;
  flameRef: React.RefObject<THREE.Mesh | null>;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(
    () =>
      prepareGlbScene(gltf.scene, {
        targetLength: CAR_LENGTH,
        rotationY,
      }),
    [gltf.scene, rotationY],
  );
  return (
    <group ref={bodyRef}>
      <primitive object={scene} />
      <mesh ref={flameRef} position={[0, 0.55, 2.05]} visible={false}>
        <coneGeometry args={[0.32, 1.4, 10]} />
        <meshStandardMaterial
          color="#ffce54"
          emissive="#ff7a18"
          emissiveIntensity={2.5}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

interface CarProps {
  model: CarModelDef;
  bodyRef: React.RefObject<THREE.Group | null>;
  flameRef: React.RefObject<THREE.Mesh | null>;
  wheelRefs: React.RefObject<THREE.Mesh | null>[];
  steerRefs: React.RefObject<THREE.Group | null>[];
}

function Wheel({ refObj }: { refObj: React.RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={refObj} castShadow rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry
        args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 18]}
      />
      <meshStandardMaterial
        color="#1a1e24"
        roughness={0.55}
        metalness={0.35}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

function ProceduralCar({
  model,
  bodyRef,
  flameRef,
  wheelRefs,
  steerRefs,
}: CarProps) {
  // Wheel positions: x = side, y = height, z = front/back (-z is forward).
  const halfTrack = 0.95;
  const wheelbase = 1.35;
  const wheelY = WHEEL_RADIUS;

  return (
    <group>
      {/* Sprung body */}
      <group ref={bodyRef} position={[0, 0, 0]}>
        {/* Lower chassis */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.5, 4.0]} />
          <meshPhysicalMaterial
            color={model.accent}
            roughness={0.35}
            metalness={0.55}
            clearcoat={0.5}
            clearcoatRoughness={0.15}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Main shell */}
        <mesh position={[0, 0.85, -0.15]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.55, 3.0]} />
          <meshPhysicalMaterial
            color={model.color}
            roughness={0.22}
            metalness={0.65}
            clearcoat={0.85}
            clearcoatRoughness={0.08}
            envMapIntensity={1.35}
          />
        </mesh>
        {/* Cabin */}
        <mesh position={[0, 1.28, 0.05]} castShadow>
          <boxGeometry args={[1.45, 0.5, 1.5]} />
          <meshPhysicalMaterial
            color="#141a22"
            roughness={0.05}
            metalness={0.75}
            clearcoat={1}
            clearcoatRoughness={0.03}
            envMapIntensity={1.5}
          />
        </mesh>
        {/* Nose wedge */}
        <mesh position={[0, 0.72, -1.85]} castShadow>
          <boxGeometry args={[1.7, 0.3, 0.6]} />
          <meshPhysicalMaterial
            color={model.color}
            roughness={0.2}
            metalness={0.6}
            clearcoat={0.75}
            clearcoatRoughness={0.1}
            envMapIntensity={1.3}
          />
        </mesh>
        {/* Headlights */}
        <mesh position={[0.55, 0.8, -2.05]}>
          <boxGeometry args={[0.3, 0.18, 0.08]} />
          <meshStandardMaterial color="#fffbe6" emissive="#fff2a8" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[-0.55, 0.8, -2.05]}>
          <boxGeometry args={[0.3, 0.18, 0.08]} />
          <meshStandardMaterial color="#fffbe6" emissive="#fff2a8" emissiveIntensity={1.2} />
        </mesh>
        {/* Rear wing */}
        <mesh position={[0, 1.35, 1.9]} castShadow>
          <boxGeometry args={[1.7, 0.08, 0.5]} />
          <meshStandardMaterial color={model.accent} roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0.7, 1.12, 1.9]}>
          <boxGeometry args={[0.1, 0.4, 0.15]} />
          <meshStandardMaterial color={model.accent} />
        </mesh>
        <mesh position={[-0.7, 1.12, 1.9]}>
          <boxGeometry args={[0.1, 0.4, 0.15]} />
          <meshStandardMaterial color={model.accent} />
        </mesh>
        {/* Boost flame */}
        <mesh ref={flameRef} position={[0, 0.6, 2.3]} visible={false}>
          <coneGeometry args={[0.35, 1.6, 12]} />
          <meshStandardMaterial
            color="#ffce54"
            emissive="#ff7a18"
            emissiveIntensity={2.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Front wheels (steered) */}
      <group ref={steerRefs[0]} position={[halfTrack, wheelY, -wheelbase]}>
        <Wheel refObj={wheelRefs[0]!} />
      </group>
      <group ref={steerRefs[1]} position={[-halfTrack, wheelY, -wheelbase]}>
        <Wheel refObj={wheelRefs[1]!} />
      </group>
      {/* Rear wheels */}
      <group position={[halfTrack, wheelY, wheelbase]}>
        <Wheel refObj={wheelRefs[2]!} />
      </group>
      <group position={[-halfTrack, wheelY, wheelbase]}>
        <Wheel refObj={wheelRefs[3]!} />
      </group>
    </group>
  );
}

// Preload helper kept for parity with GLB-based models.
export function preloadCarModel(def: CarModelDef) {
  if (def.glb) useGLTF.preload(def.glb);
}
