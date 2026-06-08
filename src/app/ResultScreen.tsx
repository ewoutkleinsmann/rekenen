import { useGameStore } from "../game/store";
import { getLevel } from "../config/loadConfig";
import { ScreenShell } from "../ui/ScreenShell";
import { TrophyIcon, CheckeredFlagIcon } from "../ui/icons";

export function ResultScreen() {
  const lastRaceResult = useGameStore((s) => s.lastRaceResult);
  const level = useGameStore((s) => s.level);
  const continueAfterResult = useGameStore((s) => s.continueAfterResult);
  const levelConfig = getLevel(level);

  const won = lastRaceResult?.success ?? false;

  return (
    <ScreenShell
      variant="result"
      className={`result-screen hw-panel ${won ? "win" : "lose"}`}
      level={level}
      badge="Finish Gate"
    >
      <div style={{ textAlign: "center" }}>
        {won ? (
          <>
            <TrophyIcon size={64} className="result-icon" />
            <h2
              className="hw-title hw-display"
              style={{ fontSize: "1.8rem", color: "var(--hw-success)" }}
            >
              Gehaald!
            </h2>
            <CheckeredFlagIcon size={36} />
            <p>
              Level {level} — {levelConfig.name} voltooid!
            </p>
            {level < 9 && <p>Volgende level is unlocked!</p>}
          </>
        ) : (
          <>
            <img
              src="/assets/brand/hot-wheels-flame.svg"
              alt=""
              className="result-icon"
              style={{ opacity: 0.7 }}
            />
            <h2
              className="hw-title hw-display"
              style={{ fontSize: "1.6rem", color: "var(--hw-error)" }}
            >
              Niet gehaald!
            </h2>
            <p>
              {lastRaceResult?.failureReason ??
                "Probeer opnieuw met een betere auto of upgrades!"}
            </p>
            <p>Blijf op level {level} en verdien meer credits.</p>
          </>
        )}
        <button
          type="button"
          className="hw-btn hw-btn-primary hw-btn-racing"
          style={{ marginTop: 16 }}
          onClick={continueAfterResult}
        >
          {won && level < 9 ? "Volgende level!" : "Nieuwe ronde!"}
        </button>
      </div>
    </ScreenShell>
  );
}
