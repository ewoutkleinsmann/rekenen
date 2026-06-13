import { Suspense, lazy } from "react";
import { useGameStore } from "../game/store";
import { getLevel, getTrack, getQuestionType } from "../config/loadConfig";
import { getLevelShopHighlights } from "../garage/shopHighlights";
import { ScreenShell } from "../ui/ScreenShell";
import { CheckeredFlagIcon, WheelCreditIcon } from "../ui/icons";
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
  const ownedCars = useGameStore((s) => s.ownedCars);
  const beginQuiz = useGameStore((s) => s.beginQuiz);

  const levelConfig = getLevel(level);
  const track = getTrack(levelConfig.trackId);
  const parSec = resolveTrackTimeLimitSec(
    track,
    buildTrack3d(track).finishDist,
  );
  const newCategories = newCategoriesForLevel(level);
  const shop = getLevelShopHighlights(level, ownedCars);
  const showShopBlock =
    shop.newCarsThisLevel.length > 0 ||
    shop.purchasableCars.length > 0 ||
    shop.upgradesAvailable;

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

      {showShopBlock && (
        <div className="intro-new-block intro-shop-block">
          <h3 className="intro-new-heading">Na de quiz — Booster Shop</h3>
          <ul className="intro-shop-list">
            {shop.newCarsThisLevel.length > 0 && (
              <li className="intro-shop-item intro-shop-item--new">
                <strong>Nieuwe auto&apos;s</strong>
                <span>
                  {shop.newCarsThisLevel.map((c) => c.name).join(", ")}
                </span>
              </li>
            )}
            {shop.purchasableCars.length > 0 &&
              shop.newCarsThisLevel.length === 0 && (
                <li className="intro-shop-item">
                  <strong>Auto&apos;s te koop</strong>
                  <span>
                    {shop.purchasableCars.map((c) => c.name).join(", ")}
                  </span>
                </li>
              )}
            {shop.upgradesAvailable && (
              <li className="intro-shop-item">
                <strong>Upgrades</strong>
                <span>
                  Nog {shop.upgradeSlotsRemaining} upgrade-niveaus mogelijk
                  voor je auto&apos;s
                </span>
              </li>
            )}
            {credits > 0 && (
              <li className="intro-shop-credits">
                <WheelCreditIcon size={20} /> {credits} Wheel Credits
              </li>
            )}
          </ul>
        </div>
      )}

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
