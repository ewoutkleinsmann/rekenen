import { useEffect, useState } from "react";
import { useGameStore } from "../game/store";
import { getLevel, getTrack } from "../config/loadConfig";
import { getCar } from "../config/loadConfig";
import { RaceCanvas } from "../race/RaceCanvas";
import { ScreenShell } from "../ui/ScreenShell";
import { SegmentIcon } from "../ui/icons";

export function RaceScreen() {
  const level = useGameStore((s) => s.level);
  const ownedCars = useGameStore((s) => s.ownedCars);
  const selectedCarInstanceId = useGameStore((s) => s.selectedCarInstanceId);
  const raceKeyframes = useGameStore((s) => s.raceKeyframes);
  const runRace = useGameStore((s) => s.runRace);
  const finishRace = useGameStore((s) => s.finishRace);
  const lastRaceResult = useGameStore((s) => s.lastRaceResult);
  const [started, setStarted] = useState(false);
  const keyframes = raceKeyframes ?? [];

  const levelConfig = getLevel(level);
  const track = getTrack(levelConfig.trackId);
  const instance = ownedCars.find(
    (c) => c.instanceId === selectedCarInstanceId,
  );
  const car = instance ? getCar(instance.carId) : null;

  useEffect(() => {
    if (!started && !lastRaceResult) {
      runRace();
      setStarted(true);
    }
  }, [started, lastRaceResult, runRace]);

  useEffect(() => {
    if (started && keyframes.length === 0 && lastRaceResult) {
      const t = setTimeout(finishRace, 500);
      return () => clearTimeout(t);
    }
  }, [started, keyframes.length, lastRaceResult, finishRace]);

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
      <div className="segment-row">
        {track.segments.map((seg, i) => (
          <SegmentIcon key={i} type={seg.type} size={28} />
        ))}
      </div>
      <RaceCanvas
        keyframes={keyframes}
        segments={track.segments}
        success={lastRaceResult?.success ?? false}
        playing={keyframes.length > 0}
        carId={car?.id}
        onComplete={finishRace}
      />
    </ScreenShell>
  );
}
