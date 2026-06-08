import { useCallback, useState } from "react";
import {
  getCar,
  getCarsConfig,
  getTrack,
  getTracksConfig,
} from "../config/loadConfig";
import { computeEffectiveStats } from "../garage/stats";
import type { CarInstance } from "../game/types";
import { simulateRace, getPlaybackDurationMs } from "../race/simulation";
import type { SimulationResult } from "../race/types";
import { RaceCanvas } from "../race/RaceCanvas";
import { ScreenShell } from "../ui/ScreenShell";
import { SegmentIcon } from "../ui/icons";

export function RaceDevScreen() {
  const tracks = getTracksConfig().tracks;
  const cars = getCarsConfig().cars;

  const [trackId, setTrackId] = useState(tracks[0]?.id ?? "track-01");
  const [carId, setCarId] = useState(cars[0]?.id ?? "booster-blaze");
  const [rocketUnlock, setRocketUnlock] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [runId, setRunId] = useState(0);

  const track = getTrack(trackId);
  const car = getCar(carId);

  const run = useCallback(() => {
    const instance: CarInstance = {
      instanceId: "dev",
      carId,
      upgrades: rocketUnlock
        ? [{ upgradeId: "baan-blaster-rockets", level: 1 }]
        : [],
    };
    const stats = computeEffectiveStats(instance);
    setResult(simulateRace(stats, track.segments));
    setRunId((n) => n + 1);
  }, [carId, rocketUnlock, track.segments]);

  const playbackMs = result ? getPlaybackDurationMs(result.totalTicks) : 0;

  return (
    <ScreenShell variant="race" className="race-dev-screen" badge="Race Dev">
      <h2 className="hw-title hw-display" style={{ fontSize: "1.4rem" }}>
        Race Dev
      </h2>
      <p className="hw-subtitle" style={{ textAlign: "center" }}>
        Test een track + auto combinatie
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

        <button type="button" className="hw-btn hw-btn-primary" onClick={run}>
          {result ? "Opnieuw" : "Start race"}
        </button>
      </div>

      {result && (
        <div className="race-dev-debug">
          <strong>{result.success ? "Geslaagd" : "Gefaald"}</strong>
          {!result.success && result.failureReason && (
            <span> — {result.failureReason}</span>
          )}
          {!result.success && result.failureSegmentIndex !== undefined && (
            <span> (segment {result.failureSegmentIndex})</span>
          )}
          <div className="race-dev-meta">
            ticks: {result.totalTicks} · keyframes: {result.keyframes.length} ·
            playback: ~{(playbackMs / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      <div className="segment-row">
        {track.segments.map((seg, i) => (
          <SegmentIcon key={i} type={seg.type} size={28} />
        ))}
      </div>

      {result && result.keyframes.length > 0 && (
        <>
          <p
            style={{ textAlign: "center", fontFamily: "Rajdhani, sans-serif" }}
          >
            {car.name} op {track.name}
          </p>
          <RaceCanvas
            key={runId}
            keyframes={result.keyframes}
            segments={track.segments}
            success={result.success}
            playing
            carId={car.id}
          />
        </>
      )}
    </ScreenShell>
  );
}
