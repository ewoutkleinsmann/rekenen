import { useState } from "react";
import { useGameStore } from "../game/store";
import { loadSave } from "../game/persistence";
import { HotWheelsLogo } from "../ui/icons";
import { LoopArchDecor } from "../ui/decor/LoopArchDecor";
import { SpeedLinesDecor } from "../ui/decor/SpeedLinesDecor";

export function TitleScreen() {
  const [name, setName] = useState("");
  const newGame = useGameStore((s) => s.newGame);
  const startLevel = useGameStore((s) => s.startLevel);
  const init = useGameStore((s) => s.init);
  const level = useGameStore((s) => s.level);

  const saved = loadSave();
  const hasSave =
    saved !== null &&
    (saved.level > 1 || saved.credits > 0 || saved.phase !== "title");

  return (
    <div className="title-screen screen-shell">
      <LoopArchDecor />
      <HotWheelsLogo className="hero-logo" />
      <p className="hw-display hw-subtitle" style={{ fontSize: "1.6rem" }}>
        Rekenen
      </p>
      <span className="hw-badge">Race Portal</span>
      <p className="hw-subtitle" style={{ marginTop: "0.5rem" }}>
        Race naar de finish met supersnel rekenen!
      </p>
      <div className="hw-panel-track" style={{ position: "relative" }}>
        <SpeedLinesDecor />
        <label htmlFor="player-name">Je naam (optioneel)</label>
        <input
          id="player-name"
          className="hw-answer-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Racer"
          style={{ marginTop: "0.5rem" }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {hasSave ? (
          <button
            type="button"
            className="hw-btn hw-btn-primary hw-btn-racing"
            onClick={() => {
              init();
              const phase = saved?.phase ?? "quiz";
              if ((phase === "quiz" || phase === "intro") && !saved?.roundState)
                startLevel();
            }}
          >
            Verder spelen — Level {saved?.level ?? level}
          </button>
        ) : null}
        <button
          type="button"
          className="hw-btn hw-btn-secondary"
          onClick={() => {
            newGame(name || undefined);
            startLevel();
          }}
        >
          {hasSave ? "Nieuw spel" : "Start Engine!"}
        </button>
        {import.meta.env.DEV && (
          <a
            href="?devRace=1"
            className="hw-btn hw-btn-secondary"
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            Race dev
          </a>
        )}
      </div>
      <div className="hw-footer">
        <img src="/assets/brand/mattel-logo.svg" alt="Mattel" />
      </div>
    </div>
  );
}
