import { useState } from "react";
import { useGameStore } from "../game/store";
import { loadSave } from "../game/persistence";

export function TitleScreen() {
  const [name, setName] = useState("");
  const newGame = useGameStore((s) => s.newGame);
  const startQuiz = useGameStore((s) => s.startQuiz);
  const init = useGameStore((s) => s.init);
  const level = useGameStore((s) => s.level);

  const saved = loadSave();
  const hasSave =
    saved !== null &&
    (saved.level > 1 || saved.credits > 0 || saved.phase !== "title");

  return (
    <div className="title-screen">
      <h1 className="hw-title">Hot Wheels Rekenen</h1>
      <p className="hw-subtitle">Race naar de finish met supersnel rekenen!</p>
      <div className="hw-panel">
        <label htmlFor="player-name">Je naam (optioneel)</label>
        <input
          id="player-name"
          className="hw-answer-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Racer"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {hasSave ? (
          <button
            type="button"
            className="hw-btn hw-btn-primary"
            onClick={() => {
              init();
              const phase = saved?.phase ?? "quiz";
              if (phase === "quiz" && !saved?.roundState) startQuiz();
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
            startQuiz();
          }}
        >
          {hasSave ? "Nieuw spel" : "Start race!"}
        </button>
      </div>
    </div>
  );
}
