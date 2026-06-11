import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import {
  getCar,
  getCarsConfig,
  getTrack,
  getTracksConfig,
} from "../config/loadConfig";
import { computeEffectiveStats } from "../garage/stats";
import type { CarInstance } from "../game/types";
import { simulateRace3D } from "../race3d/sim/simulateRace3d";
import type { RaceReplay } from "../race3d/sim/types";
import { ScreenShell } from "../ui/ScreenShell";
import { SegmentIcon } from "../ui/icons";

const Race3D = lazy(() =>
  import("../race3d/Race3D").then((m) => ({ default: m.Race3D })),
);

export function RaceDevScreen() {
  const tracks = getTracksConfig().tracks;
  const cars = getCarsConfig().cars;

  const [trackId, setTrackId] = useState(tracks[0]?.id ?? "track-01");
  const [carId, setCarId] = useState(cars[0]?.id ?? "booster-blaze");
  const [rocketUnlock, setRocketUnlock] = useState(false);
  const [replay, setReplay] = useState<RaceReplay | null>(null);
  /** Track/car combo the current `replay` was simulated for (guards stale async + UI mismatch). */
  const [replayKey, setReplayKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);

  const track = getTrack(trackId);
  const car = getCar(carId);

  const selectionKey = `${trackId}:${carId}:${rocketUnlock ? "rocket" : "no-rocket"}`;

  useEffect(() => {
    setReplay(null);
    setReplayKey(null);
    setRunning(false);
  }, [selectionKey]);

  const run = useCallback(async () => {
    const runKey = selectionKey;
    const runTrack = getTrack(trackId);
    const instance: CarInstance = {
      instanceId: "dev",
      carId,
      upgrades: rocketUnlock
        ? [{ upgradeId: "baan-blaster-rockets", level: 1 }]
        : [],
    };
    const stats = computeEffectiveStats(instance);
    setRunning(true);
    try {
      const result = await simulateRace3D(stats, runTrack);
      if (runKey !== selectionKey) return;
      setReplay(result);
      setReplayKey(runKey);
      setRunId((n) => n + 1);
    } finally {
      if (runKey === selectionKey) setRunning(false);
    }
  }, [carId, rocketUnlock, trackId, selectionKey]);

  return (
    <ScreenShell variant="race" className="race-dev-screen" badge="Race Dev">
      <h2 className="hw-title hw-display" style={{ fontSize: "1.4rem" }}>
        Race Dev
      </h2>
      <p className="hw-subtitle" style={{ textAlign: "center" }}>
        Test een track + auto combinatie in 3D
      </p>

      <div className="race-dev-controls hw-panel-track">
        <label className="race-dev-field">
          Track
          <select
            className="hw-answer-input"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="race-dev-field">
          Auto
          <select
            className="hw-answer-input"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
          >
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="race-dev-check">
          <input
            type="checkbox"
            checked={rocketUnlock}
            onChange={(e) => setRocketUnlock(e.target.checked)}
          />
          Rocket unlock (Baan Blaster)
        </label>

        <button
          type="button"
          className="hw-btn hw-btn-primary"
          onClick={() => void run()}
          disabled={running}
        >
          {running ? "Bezig…" : replay ? "Opnieuw" : "Start race"}
        </button>
      </div>

      {replay && replayKey === selectionKey && (
        <div className="race-dev-debug">
          <strong>{replay.success ? "Geslaagd" : "Gefaald"}</strong>
          {!replay.success && replay.failureReason && (
            <span> — {replay.failureReason}</span>
          )}
          {!replay.success && replay.failureSegmentIndex !== undefined && (
            <span> (segment {replay.failureSegmentIndex})</span>
          )}
          <div className="race-dev-meta">
            frames: {replay.frames.length} · simtijd:{" "}
            {replay.totalTime.toFixed(1)}s · playback: ~
            {(replay.durationMs / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      <div className="segment-row">
        {track.segments.map((seg, i) => (
          <SegmentIcon key={i} type={seg.type} size={28} />
        ))}
      </div>

      {replay && replayKey === selectionKey && replay.frames.length > 0 && (
        <>
          <p
            style={{ textAlign: "center", fontFamily: "Rajdhani, sans-serif" }}
          >
            {car.name} op {track.name}
          </p>
          <Suspense
            fallback={
              <div className="race3d-wrap">
                <div className="race3d-loading">3D-motor laden…</div>
              </div>
            }
          >
            <Race3D
              key={`${selectionKey}-${runId}`}
              track={track}
              car={{ carId: car.id, name: car.name }}
              replay={replay}
            />
          </Suspense>
        </>
      )}
    </ScreenShell>
  );
}
