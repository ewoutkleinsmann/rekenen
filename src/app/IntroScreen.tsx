import { Suspense, lazy } from "react";
import { useGameStore } from "../game/store";
import { getLevel, getTrack, getQuestionType } from "../config/loadConfig";
import { ScreenShell } from "../ui/ScreenShell";
import { CheckeredFlagIcon } from "../ui/icons";
import { formatRaceClock } from "../race3d/sim/trackTimeLimit";
import { buildTrack3d } from "../race3d/sim/buildTrack3d";
import { resolveTrackTimeLimitSec } from "../race3d/sim/trackTimeLimit";

const TrackIntro3D = lazy(() =>
  import("../race3d/TrackIntro3D").then((m) => ({ default: m.TrackIntro3D })),
);

function newCategoriesForLevel(level: number): string[] {
  const current = getLevel(level).questionCategories;
  if (level <= 1) return current;
  const previous = new Set(getLevel(level - 1).questionCategories);
  return current.filter((c) => !previous.has(c));
}

export function IntroScreen() {
  const level = useGameStore((s) => s.level);
  const credits = useGameStore((s) => s.credits);
  const beginQuiz = useGameStore((s) => s.beginQuiz);

  const levelConfig = getLevel(level);
  const track = getTrack(levelConfig.trackId);
  const parSec = resolveTrackTimeLimitSec(
    track,
    buildTrack3d(track).finishDist,
  );
  const newCategories = newCategoriesForLevel(level);

  return (
    <ScreenShell
      variant="quiz"
      className="intro-screen"
      level={level}
      credits={credits}
      badge="Level start"
    >
      <p className="intro-eyebrow">Level {level}</p>
      <h2 className="hw-title intro-title">{levelConfig.name}</h2>

      <Suspense
        fallback={
          <div className="race3d-wrap track-intro-wrap">
            <div className="race3d-loading">Baan laden…</div>
          </div>
        }
      >
        <TrackIntro3D track={track} />
      </Suspense>

      <p className="intro-track-name">
        <CheckeredFlagIcon size={20} /> {track.name}
      </p>
      <p className="race-par-hint intro-par">
        Par-tijd: {formatRaceClock(parSec)}
      </p>

      <div className="intro-new-block">
        <h3 className="intro-new-heading">
          {level <= 1 ? "Je oefent met:" : "Nieuw in dit level:"}
        </h3>
        <ul className="intro-cat-list">
          {newCategories.map((cat) => (
            <li key={cat} className="intro-cat-chip">
              {getQuestionType(cat).label}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="hw-btn hw-btn-primary hw-btn-racing intro-start-btn"
        onClick={beginQuiz}
      >
        Start de quiz!
      </button>
    </ScreenShell>
  );
}
