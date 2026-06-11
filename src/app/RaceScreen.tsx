import { Suspense, lazy, useEffect, useState } from "react";
import { useGameStore } from "../game/store";
import { getLevel, getTrack } from "../config/loadConfig";
import { getCar } from "../config/loadConfig";
import { ScreenShell } from "../ui/ScreenShell";
import { SegmentIcon } from "../ui/icons";
import { audio } from "../audio/audio";

const Race3D = lazy(() =>
  import("../race3d/Race3D").then((m) => ({ default: m.Race3D })),
);

export function RaceScreen() {
  const level = useGameStore((s) => s.level);
  const ownedCars = useGameStore((s) => s.ownedCars);
  const selectedCarInstanceId = useGameStore((s) => s.selectedCarInstanceId);
  const raceReplay = useGameStore((s) => s.raceReplay);
  const runRace = useGameStore((s) => s.runRace);
  const finishRace = useGameStore((s) => s.finishRace);
  const lastRaceResult = useGameStore((s) => s.lastRaceResult);
  const [started, setStarted] = useState(false);

  const levelConfig = getLevel(level);
  const track = getTrack(levelConfig.trackId);
  const instance = ownedCars.find(
    (c) => c.instanceId === selectedCarInstanceId,
  );
  const car = instance ? getCar(instance.carId) : null;

  useEffect(() => {
    if (!started && !lastRaceResult) {
      void runRace();
      setStarted(true);
    }
  }, [started, lastRaceResult, runRace]);

  // Race soundtrack: play while this screen is mounted.
  useEffect(() => {
    audio.startRaceMusic();
    return () => audio.stopMusic();
  }, []);

  // Safety net: if the replay somehow has no frames, advance after a beat.
  useEffect(() => {
    if (started && lastRaceResult && (raceReplay?.frames.length ?? 0) === 0) {
      const t = setTimeout(finishRace, 500);
      return () => clearTimeout(t);
    }
  }, [started, raceReplay, lastRaceResult, finishRace]);

  return (
    <ScreenShell
      variant="race"
      className="race-screen"
      level={level}
      badge="Race Portal"
    >
      <h2 className="hw-title hw-display" style={{ fontSize: "1.4rem" }}>
        {track.name}
      </h2>
      <p style={{ textAlign: "center", fontFamily: "Rajdhani, sans-serif" }}>
        {car?.name ?? "Auto"} rijdt!
      </p>
      {raceReplay?.timeLimitSec != null && (
        <p className="race-par-hint">
          Par-tijd:{" "}
          {Math.floor(raceReplay.timeLimitSec / 60)}:
          {String(Math.floor(raceReplay.timeLimitSec % 60)).padStart(2, "0")}
          {raceReplay.timeLimitSec % 1 >= 0.05
            ? `.${Math.floor((raceReplay.timeLimitSec % 1) * 10)}`
            : ""}
        </p>
      )}
      <div className="segment-row">
        {track.segments.map((seg, i) => (
          <SegmentIcon key={i} type={seg.type} size={28} />
        ))}
      </div>
      {raceReplay && raceReplay.frames.length > 0 ? (
        <Suspense
          fallback={
            <div className="race3d-wrap">
              <div className="race3d-loading">3D-motor laden…</div>
            </div>
          }
        >
          <Race3D
            track={track}
            car={{ carId: car?.id, name: car?.name }}
            replay={raceReplay}
            onComplete={finishRace}
          />
        </Suspense>
      ) : (
        <div className="race3d-wrap">
          <div className="race3d-loading">Race klaarzetten…</div>
        </div>
      )}
    </ScreenShell>
  );
}
