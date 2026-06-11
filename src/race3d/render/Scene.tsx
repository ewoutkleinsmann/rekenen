import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { buildTrack3d } from "../sim/buildTrack3d";
import type { TrackConfig } from "../../config/schemas";
import type { RaceReplay } from "../sim/types";
import { Landscape } from "./Landscape";
import { CarModel } from "./CarModel";
import { sampleReplay, makeSampledState } from "./sampleReplay";
import type { PlaybackRef } from "./playback";
import {
  introProgress,
  raceProgress,
  totalProgress,
} from "./playback";
import { RendererSetup } from "./RendererSetup";
import {
  CinematicDirector,
  computeTrackOverview,
  sampleCameraTarget,
  targetFov,
} from "./raceCamera";

interface Props {
  track: TrackConfig;
  replay: RaceReplay;
  carId?: string;
  playback: PlaybackRef;
  onComplete?: () => void;
}

const SUN_POSITION: [number, number, number] = [75, 85, 50];

export function Scene({ track, replay, carId, playback, onComplete }: Props) {
  const built = useMemo(() => buildTrack3d(track), [track]);
  const groundY = built.bounds.min[1] - 0.5;
  const overview = useMemo(() => computeTrackOverview(built), [built]);
  const cx = (built.bounds.min[0] + built.bounds.max[0]) / 2;
  const cz = (built.bounds.min[2] + built.bounds.max[2]) / 2;

  return (
    <>
      <RendererSetup />

      <color attach="background" args={["#6a9fc8"]} />

      <Sky
        distance={4500}
        sunPosition={SUN_POSITION}
        turbidity={1.6}
        rayleigh={0.75}
        mieCoefficient={0.0008}
        mieDirectionalG={0.62}
      />

      <Environment preset="park" environmentIntensity={0.5} background={false} />

      <hemisphereLight
        color="#b8dcff"
        groundColor="#5a9a58"
        intensity={0.55}
      />
      <ambientLight intensity={0.28} color="#d4e6f8" />

      <directionalLight
        position={[-55, 110, -45]}
        intensity={0.7}
        color="#e6f0ff"
      />

      <directionalLight
        position={SUN_POSITION}
        intensity={1.65}
        color="#fff0d8"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={2}
        shadow-camera-far={520}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      <pointLight
        position={[cx + 70, 35, cz + 40]}
        intensity={65}
        color="#5ce8ff"
        distance={280}
        decay={2}
      />
      <pointLight
        position={[cx - 60, 28, cz - 50]}
        intensity={50}
        color="#ff7a68"
        distance={240}
        decay={2}
      />

      <Suspense fallback={null}>
        <Landscape track={built} groundY={groundY} />
      </Suspense>

      <CarModel carId={carId} replay={replay} playback={playback} />

      <CameraRig
        replay={replay}
        playback={playback}
        overview={overview}
      />
      <PlaybackController
        playback={playback}
        replay={replay}
        onComplete={onComplete}
      />
    </>
  );
}

const _state = makeSampledState();
const _camPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

function CameraRig({
  replay,
  playback,
  overview,
}: {
  replay: RaceReplay;
  playback: PlaybackRef;
  overview: ReturnType<typeof computeTrackOverview>;
}) {
  const { camera } = useThree();
  const director = useMemo(() => new CinematicDirector(), []);
  const initialised = useRef(false);

  useEffect(() => {
    director.reset();
    initialised.current = false;
  }, [director, replay]);

  useFrame(() => {
    const pb = playback.current;
    const introT = introProgress(pb);
    const raceP = raceProgress(pb);
    sampleReplay(replay, introT < 1 ? 0 : raceP, _state);

    const mode =
      introT < 1
        ? "chase"
        : director.update(raceP, performance.now());

    const shotMode = introT < 1 ? "chase" : mode;
    sampleCameraTarget(
      shotMode,
      _state,
      overview,
      introT,
      _camPos,
      _lookAt,
    );

    if (!initialised.current) {
      camera.position.copy(_camPos);
      initialised.current = true;
    } else {
      const blend = introT < 1 ? 0.14 : _state.boosting ? 0.16 : 0.11;
      camera.position.lerp(_camPos, blend);
    }
    camera.lookAt(_lookAt);

    const cam = camera as THREE.PerspectiveCamera;
    const wantFov = targetFov(shotMode, _state.speed, _state.boosting);
    cam.fov += (wantFov - cam.fov) * 0.08;
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
    if (totalProgress(pb) >= 1) {
      done.current = true;
      onComplete?.();
    }
  });

  return null;
}
