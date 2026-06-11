import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { buildTrack3d } from "../sim/buildTrack3d";
import type { TrackConfig } from "../../config/schemas";
import type { RaceReplay } from "../sim/types";
import { Track3D } from "./Track3D";
import { CarModel } from "./CarModel";
import { sampleReplay, makeSampledState } from "./sampleReplay";
import type { PlaybackRef } from "./playback";

interface Props {
  track: TrackConfig;
  replay: RaceReplay;
  carId?: string;
  playback: PlaybackRef;
  onComplete?: () => void;
}

export function Scene({ track, replay, carId, playback, onComplete }: Props) {
  const built = useMemo(() => buildTrack3d(track), [track]);
  const groundY = built.bounds.min[1] - 0.5;

  return (
    <>
      <color attach="background" args={["#afd6ff"]} />
      <fog attach="fog" args={["#bfe0ff", 120, 420]} />

      <Sky distance={4500} sunPosition={[60, 40, -30]} turbidity={6} rayleigh={2} />

      <hemisphereLight args={["#dff1ff", "#3a4a2a", 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[60, 90, 40]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
      />

      <Ground y={groundY} center={built.bounds} />

      <Track3D track={built} />
      <CarModel carId={carId} replay={replay} playback={playback} />

      <CameraRig replay={replay} playback={playback} />
      <PlaybackController
        playback={playback}
        replay={replay}
        onComplete={onComplete}
      />

      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

function Ground({
  y,
  center,
}: {
  y: number;
  center: { min: [number, number, number]; max: [number, number, number] };
}) {
  const cx = (center.min[0] + center.max[0]) / 2;
  const cz = (center.min[2] + center.max[2]) / 2;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[cx, y, cz]}
      receiveShadow
    >
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color="#4f7a3a" roughness={1} metalness={0} />
    </mesh>
  );
}

const _state = makeSampledState();
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function CameraRig({
  replay,
  playback,
}: {
  replay: RaceReplay;
  playback: PlaybackRef;
}) {
  const { camera } = useThree();
  const initialised = useRef(false);

  useFrame(() => {
    const pb = playback.current;
    const progress =
      pb.startTime != null
        ? Math.min(1, (performance.now() - pb.startTime) / pb.durationMs)
        : 0;
    sampleReplay(replay, progress, _state);

    // Behind (+local Z) and above the car.
    _offset.set(0, 4.2, 11).applyQuaternion(_state.quat);
    _camTarget.copy(_state.pos).add(_offset);
    _lookTarget.copy(_state.pos).addScaledVector(_up, 1.4);

    if (!initialised.current) {
      camera.position.copy(_camTarget);
      initialised.current = true;
    } else {
      const boostPull = _state.boosting ? 0.18 : 0.12;
      camera.position.lerp(_camTarget, boostPull);
    }
    camera.lookAt(_lookTarget);

    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = 55 + Math.min(18, _state.speed * 0.12) + (_state.boosting ? 6 : 0);
    cam.fov += (targetFov - cam.fov) * 0.1;
    cam.updateProjectionMatrix();
  });

  return null;
}

function PlaybackController({
  playback,
  replay,
  onComplete,
}: {
  playback: PlaybackRef;
  replay: RaceReplay;
  onComplete?: () => void;
}) {
  const done = useRef(false);

  useEffect(() => {
    playback.current.durationMs = replay.durationMs;
    playback.current.startTime = performance.now();
    done.current = false;
  }, [playback, replay]);

  useFrame(() => {
    const pb = playback.current;
    if (pb.startTime == null || done.current) return;
    const progress = (performance.now() - pb.startTime) / pb.durationMs;
    if (progress >= 1) {
      done.current = true;
      onComplete?.();
    }
  });

  return null;
}
