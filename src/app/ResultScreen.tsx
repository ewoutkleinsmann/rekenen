import { useGameStore } from "../game/store";
import { getLevel } from "../config/loadConfig";

export function ResultScreen() {
  const lastRaceResult = useGameStore((s) => s.lastRaceResult);
  const level = useGameStore((s) => s.level);
  const continueAfterResult = useGameStore((s) => s.continueAfterResult);
  const levelConfig = getLevel(level);

  const won = lastRaceResult?.success ?? false;

  return (
    <div className="result-screen hw-panel" style={{ textAlign: "center" }}>
      {won ? (
        <>
          <h2
            className="hw-title"
            style={{ fontSize: "1.8rem", color: "var(--hw-success)" }}
          >
            Gehaald! 🏆
          </h2>
          <p>
            Level {level} — {levelConfig.name} voltooid!
          </p>
          {level < 9 && <p>Volgende level is unlocked!</p>}
        </>
      ) : (
        <>
          <h2
            className="hw-title"
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
        className="hw-btn hw-btn-primary"
        style={{ marginTop: 16 }}
        onClick={continueAfterResult}
      >
        {won && level < 9 ? "Volgende level!" : "Nieuwe ronde!"}
      </button>
    </div>
  );
}
