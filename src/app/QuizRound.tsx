import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";
import { getLevel } from "../config/loadConfig";
import { QuestionDisplay } from "../ui/QuestionDisplay";

export function QuizRound() {
  const roundState = useGameStore((s) => s.roundState);
  const questions = useGameStore((s) => s.questions);
  const level = useGameStore((s) => s.level);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startRef = useRef(0);
  const questionIndex = roundState?.questionIndex ?? 0;
  const question = questions[questionIndex];
  const levelConfig = getLevel(level);

  const goNext = useCallback(
    (remaining: number) => {
      if (!question) return;
      submitAnswer(input, remaining);
      setInput("");
      setFeedback(null);
    },
    [input, question, submitAnswer],
  );

  useEffect(() => {
    if (!question) return;
    startRef.current = performance.now();
    setTimeRemaining(question.timeMs);
    const id = setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, question.timeMs - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setFeedback("bad");
        setTimeout(() => goNext(0), 600);
      }
    }, 50);
    return () => clearInterval(id);
  }, [question, goNext]);

  if (!question || !roundState) return null;

  const pct = (timeRemaining / question.timeMs) * 100;

  const handleSubmit = () => {
    if (feedback) return;
    const remaining = Math.max(0, timeRemaining);
    const num = parseInt(input.trim(), 10);
    const ok = !Number.isNaN(num) && num === question.correctAnswer;
    setFeedback(ok ? "ok" : "bad");
    setTimeout(() => goNext(remaining), 600);
  };

  const appendDigit = (d: string) => setInput((v) => v + d);
  const backspace = () => setInput((v) => v.slice(0, -1));

  return (
    <div className="quiz-round">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          Level {level}: {levelConfig.name}
        </span>
        <span className="hw-credits">🛞 {roundState.creditsThisRound}</span>
      </div>
      <div className="hw-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`hw-progress-dot ${i < questionIndex ? "done" : ""} ${i === questionIndex ? "current" : ""}`}
          />
        ))}
      </div>
      <p style={{ textAlign: "center", color: "var(--hw-muted)" }}>
        Vraag {questionIndex + 1} / {questions.length}
      </p>
      <div className="hw-timer-bar">
        <div className="hw-timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <QuestionDisplay question={question} />
      {feedback && (
        <p className={`hw-feedback ${feedback}`}>
          {feedback === "ok" ? "Yes! 🏁" : "Mis! Probeer sneller!"}
        </p>
      )}
      <input
        className="hw-answer-input"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        inputMode="numeric"
        aria-label="Antwoord"
        autoFocus
      />
      <div className="hw-keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map(
          (key) => (
            <button
              key={key}
              type="button"
              className={key === "✓" ? "hw-key-wide" : ""}
              onClick={() => {
                if (key === "⌫") backspace();
                else if (key === "✓") handleSubmit();
                else appendDigit(key);
              }}
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
