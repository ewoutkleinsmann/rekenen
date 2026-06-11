import { useEffect, useRef, useState } from "react";
import type { RaceReplay } from "../sim/types";
import type { PlaybackRef } from "./playback";
import {
  introProgress,
  raceProgress,
  totalProgress,
} from "./playback";
import { formatRaceClock } from "../sim/trackTimeLimit";
import { audio } from "../../audio/audio";

interface Props {
  replay: RaceReplay;
  playback: PlaybackRef;
}

export function RaceHud({ replay, playback }: Props) {
  const limit = replay.timeLimitSec ?? replay.totalTime * 1.5;
  const [remaining, setRemaining] = useState(limit);
  const [simTime, setSimTime] = useState(0);
  const [showOutcome, setShowOutcome] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    setShowOutcome(false);
    setRemaining(limit);
    setSimTime(0);

    let raf = 0;
    const tick = () => {
      const pb = playback.current;
      const intro = introProgress(pb);
      const rp = raceProgress(pb);
      const st = intro < 1 ? 0 : rp * replay.totalTime;
      setSimTime(st);
      setRemaining(Math.max(0, limit - st));

      const raceDone = intro >= 1 && rp >= 0.998;
      const allDone = totalProgress(pb) >= 0.998;
      if ((raceDone || allDone) && !endedRef.current) {
        endedRef.current = true;
        setShowOutcome(true);
        audio.stopMusic();
        if (replay.success) audio.playRaceVictory();
        else audio.playRaceFail();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [replay, playback, limit]);

  const urgent = remaining <= 3 && simTime > 0;
  const timedOut =
    !replay.success &&
    (replay.failureReason?.includes("Tijd") ?? false);

  return (
    <div className="race-hud" aria-live="polite">
      <div className={`race-hud-timer ${urgent ? "race-hud-timer--urgent" : ""}`}>
        <span className="race-hud-timer-label">Tijd</span>
        <span className="race-hud-timer-value">{formatRaceClock(remaining)}</span>
      </div>
      <div className="race-hud-par">
        Par {formatRaceClock(limit)}
      </div>

      {introProgress(playback.current) < 1 && (
        <div className="race-hud-go">Baan verkennen…</div>
      )}

      {showOutcome && (
        <div
          className={`race-hud-outcome ${replay.success ? "race-hud-outcome--win" : "race-hud-outcome--lose"}`}
        >
          <p className="race-hud-outcome-title">
            {replay.success ? "Gehaald!" : timedOut ? "Tijd op!" : "Mislukt!"}
          </p>
          {!replay.success && replay.failureReason && (
            <p className="race-hud-outcome-reason">{replay.failureReason}</p>
          )}
          {replay.success && (
            <p className="race-hud-outcome-reason">
              Finish in {formatRaceClock(simTime)} (par {formatRaceClock(limit)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
