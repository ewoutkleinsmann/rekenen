import { Suspense, useEffect, useMemo, useRef, useState } from "react";

function raceCanvasDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5);
}
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import type { TrackConfig } from "../config/schemas";
import type { EffectiveStats } from "../garage/stats";
import type { RaceReplay } from "./sim/types";
import { simulateRace3D } from "./sim/simulateRace3d";
import { Scene } from "./render/Scene";
import { RaceErrorBoundary } from "./render/RaceErrorBoundary";
import { RaceHud } from "./render/RaceHud";
import type { PlaybackState } from "./render/playback";

export interface Race3DCar {
  carId?: string;
  name?: string;
  /** Required only when `replay` is not provided (component computes it). */
  stats?: EffectiveStats;
}

interface Props {
  /** The shape of the track to drive. */
  track: TrackConfig;
  /** The car with its (effective) stats and id. */
  car: Race3DCar;
  /** Precomputed deterministic replay. If omitted it is simulated on mount. */
  replay?: RaceReplay;
  onComplete?: () => void;
}

export function Race3D({ track, car, replay: replayProp, onComplete }: Props) {
  const [computed, setComputed] = useState<RaceReplay | null>(null);
  const playback = useRef<PlaybackState>({ startTime: null, durationMs: 10000 });
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeFired = useRef(false);

  const replay = replayProp ?? computed;

  const scheduleComplete = () => {
    if (completeFired.current || !onComplete) return;
    completeFired.current = true;
    completeTimer.current = setTimeout(() => onComplete(), 2600);
  };

  useEffect(
    () => () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
    },
    [],
  );

  useEffect(() => {
    completeFired.current = false;
    if (completeTimer.current) clearTimeout(completeTimer.current);
  }, [replay]);

  useEffect(() => {
    if (replayProp || !car.stats) return;
    let alive = true;
    simulateRace3D(car.stats, track).then((r) => {
      if (alive) setComputed(r);
    });
    return () => {
      alive = false;
    };
  }, [replayProp, car.stats, track]);

  const sceneKey = useMemo(
    () => `${track.id}-${car.carId}-${replay?.frames.length ?? 0}`,
    [track.id, car.carId, replay],
  );

  return (
    <div className="race3d-wrap">
      {!replay && <div className="race3d-loading">3D-baan laden…</div>}
      {replay && (
        <RaceHud replay={replay} playback={playback} />
      )}
      <RaceErrorBoundary>
        <Canvas
          shadows
          dpr={raceCanvasDpr()}
          camera={{ fov: 55, near: 0.5, far: 2000, position: [0, 8, 18] }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <Suspense fallback={null}>
            {replay && (
              <Scene
                key={sceneKey}
                track={track}
                replay={replay}
                carId={car.carId}
                playback={playback}
                onComplete={scheduleComplete}
              />
            )}
          </Suspense>
        </Canvas>
      </RaceErrorBoundary>
    </div>
  );
}
