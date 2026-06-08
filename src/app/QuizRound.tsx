import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";
import { getLevel } from "../config/loadConfig";
import { validateAnswer } from "../questions/registry";
import { QuestionDisplay } from "../ui/QuestionDisplay";
import { ScreenShell } from "../ui/ScreenShell";
import { CheckeredFlagIcon } from "../ui/icons";

export function QuizRound() {
  const roundState = useGameStore((s) => s.roundState);
  const questions = useGameStore((s) => s.questions);
  const level = useGameStore((s) => s.level);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startRef = useRef(0);
  const inputRef = useRef(input);
  inputRef.current = input;
  const questionIndex = roundState?.questionIndex ?? 0;
  const question = questions[questionIndex];
  const levelConfig = getLevel(level);

  const goNext = useCallback(
    (remaining: number) => {
      if (!question) return;
      submitAnswer(inputRef.current, remaining);
      setInput("");
      setFeedback(null);
    },
    [question, submitAnswer],
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

  const isClockQuestion = question.display === "clock";
  const pct = (timeRemaining / question.timeMs) * 100;

  const handleSubmit = () => {
    if (feedback) return;
    const remaining = Math.max(0, timeRemaining);
    const ok = validateAnswer(question, input);
    setFeedback(ok ? "ok" : "bad");
    setTimeout(() => goNext(remaining), 600);
  };

  return (
    <ScreenShell
      variant="quiz"
      className="quiz-round"
      level={level}
      credits={roundState.creditsThisRound}
      badge="Quiz"
    >
      <p
        style={{
          textAlign: "center",
          margin: "0 0 0.5rem",
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 600,
        }}
      >
        {levelConfig.name}
      </p>
      <div className="hw-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`hw-progress-segment ${i < questionIndex ? "done" : ""} ${i === questionIndex ? "current" : ""}`}
          />
        ))}
      </div>
      <p
        style={{
          textAlign: "center",
          color: "var(--hw-muted)",
          fontSize: "0.9rem",
        }}
      >
        Vraag {questionIndex + 1} / {questions.length}
      </p>
      <div className="hw-timer-bar">
        <div className="hw-timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="hw-panel-question question-area">
        <QuestionDisplay question={question} />
      </div>
      {feedback && (
        <p className={`hw-feedback ${feedback}`}>
          {feedback === "ok" ? (
            <>
              <CheckeredFlagIcon size={28} /> Goed!
            </>
          ) : (
            "Mis! Probeer sneller!"
          )}
        </p>
      )}
      <div className="hw-answer-row">
        <input
          className="hw-answer-input"
          value={input}
          onChange={(e) =>
            setInput(
              isClockQuestion
                ? e.target.value
                : e.target.value.replace(/\D/g, ""),
            )
          }
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          inputMode={isClockQuestion ? "text" : "numeric"}
          aria-label="Antwoord"
          placeholder={
            isClockQuestion ? "bijv. drie uur, half vijf" : "Typ je antwoord"
          }
          autoFocus
        />
        <button
          type="button"
          className="hw-btn hw-btn-primary hw-answer-submit"
          onClick={handleSubmit}
        >
          Antwoord
        </button>
      </div>
      <p className="hw-answer-hint">Druk op Enter om te bevestigen</p>
    </ScreenShell>
  );
}
