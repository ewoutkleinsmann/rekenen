import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import type { TrackConfig } from "../config/schemas";
import { buildTrack3d } from "./sim/buildTrack3d";
import { Landscape } from "./render/Landscape";
import { RendererSetup } from "./render/RendererSetup";
import { computeTrackOverview } from "./render/raceCamera";
import { RaceErrorBoundary } from "./render/RaceErrorBoundary";

interface Props {
  track: TrackConfig;
}

function dpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5);
}

const SUN_POSITION: [number, number, number] = [75, 85, 50];

/** Static, car-less preview of a track with a slowly orbiting camera. */
export function TrackIntro3D({ track }: Props) {
  return (
    <div className="race3d-wrap track-intro-wrap">
      <RaceErrorBoundary>
        <Canvas
          shadows
          dpr={dpr()}
          camera={{ fov: 50, near: 0.5, far: 2000, position: [0, 80, 120] }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <Suspense fallback={null}>
            <PreviewScene track={track} />
          </Suspense>
        </Canvas>
      </RaceErrorBoundary>
    </div>
  );
}

function PreviewScene({ track }: Props) {
  const built = useMemo(() => buildTrack3d(track), [track]);
  const groundY = built.bounds.min[1] - 0.5;
  const overview = useMemo(() => computeTrackOverview(built), [built]);

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
      <hemisphereLight color="#b8dcff" groundColor="#5a9a58" intensity={0.55} />
      <ambientLight intensity={0.3} color="#d4e6f8" />
      <directionalLight
        position={SUN_POSITION}
        intensity={1.6}
        color="#fff0d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={2}
        shadow-camera-far={520}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      <Suspense fallback={null}>
        <Landscape track={built} groundY={groundY} />
      </Suspense>
      <OrbitCamera overview={overview} />
    </>
  );
}

function OrbitCamera({
  overview,
}: {
  overview: ReturnType<typeof computeTrackOverview>;
}) {
  const { camera } = useThree();
  const angle = useRef(Math.PI * 0.25);

  useFrame((_, delta) => {
    angle.current += delta * 0.12;
    const r = overview.radius * 1.15;
    const x = overview.center.x + Math.cos(angle.current) * r;
    const z = overview.center.z + Math.sin(angle.current) * r;
    const y = overview.eyeHeight * 0.85;
    camera.position.set(x, y, z);
    camera.lookAt(overview.center);
  });

  return null;
}
