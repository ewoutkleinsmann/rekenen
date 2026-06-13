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
      <div className="title-screen-inner">
        <HotWheelsLogo className="hero-logo" />
        <p className="title-game-name hw-display">Rekenen</p>
        <span className="hw-badge title-badge">Race Portal</span>
        <p className="title-tagline">
          Race naar de finish met supersnel rekenen!
        </p>

        <div className="title-panel hw-panel-track hw-chrome-border">
          <SpeedLinesDecor />
          <label className="title-name-label" htmlFor="player-name">
            Je naam <span className="title-name-optional">(optioneel)</span>
          </label>
          <input
            id="player-name"
            className="hw-answer-input title-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Racer"
            autoComplete="nickname"
          />
        </div>

        <div className="title-actions">
          {hasSave ? (
            <button
              type="button"
              className="hw-btn hw-btn-primary hw-btn-racing title-btn-primary"
              onClick={() => {
                init();
                const phase = saved?.phase ?? "quiz";
                if (
                  (phase === "quiz" || phase === "intro") &&
                  !saved?.roundState
                )
                  startLevel();
              }}
            >
              Verder spelen — Level {saved?.level ?? level}
            </button>
          ) : null}
          <button
            type="button"
            className={
              hasSave
                ? "hw-btn hw-btn-secondary title-btn-secondary"
                : "hw-btn hw-btn-primary hw-btn-racing title-btn-primary"
            }
            onClick={() => {
              newGame(name || undefined);
              startLevel();
            }}
          >
            {hasSave ? "Nieuw spel" : "Start Engine!"}
          </button>
        </div>
      </div>

      <div className="hw-footer title-footer">
        <img src="/assets/brand/mattel-logo.svg" alt="Mattel" />
      </div>
    </div>
  );
}
