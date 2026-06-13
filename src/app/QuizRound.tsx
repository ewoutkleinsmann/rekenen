import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../game/store";
import { getLevel } from "../config/loadConfig";
import { validateAnswer } from "../questions/registry";
import { QuestionDisplay } from "../ui/QuestionDisplay";
import { ScreenShell } from "../ui/ScreenShell";
import { CheckeredFlagIcon } from "../ui/icons";
import { QuizWrongAnswerModal } from "../ui/QuizWrongAnswerModal";
import { audio } from "../audio/audio";

const FEEDBACK_OK_MS = 750;

export function QuizRound() {
  const roundState = useGameStore((s) => s.roundState);
  const questions = useGameStore((s) => s.questions);
  const level = useGameStore((s) => s.level);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(input);
  inputValueRef.current = input;
  const pendingRemainingRef = useRef(0);
  const questionIndex = roundState?.questionIndex ?? 0;
  const question = questions[questionIndex];
  const levelConfig = getLevel(level);

  const focusAnswer = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const goNext = useCallback(
    (remaining: number) => {
      if (!question) return;
      if ((roundState?.answers.length ?? 0) > questionIndex) return;
      submitAnswer(inputValueRef.current, remaining);
      setInput("");
      setFeedback(null);
    },
    [question, questionIndex, roundState?.answers.length, submitAnswer],
  );

  const submittingRef = useRef(false);

  const goNextOnce = useCallback(
    (remaining: number) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      goNext(remaining);
    },
    [goNext],
  );

  const continueAfterWrong = useCallback(() => {
    goNextOnce(pendingRemainingRef.current);
  }, [goNextOnce]);

  useEffect(() => {
    submittingRef.current = false;
    if (feedback === null) focusAnswer();
  }, [questionIndex, feedback, focusAnswer]);

  useEffect(() => {
    if (!question || feedback !== null) return;
    startRef.current = performance.now();
    setTimeRemaining(question.timeMs);
    const id = setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, question.timeMs - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        pendingRemainingRef.current = 0;
        setFeedback("bad");
        audio.playWrong();
      }
    }, 50);
    return () => clearInterval(id);
  }, [question, feedback]);

  const showWrongModal = useMemo(
    () => feedback === "bad" && question != null,
    [feedback, question],
  );

  if (!question || !roundState) return null;

  const isClockQuestion = question.display === "clock";
  const pct = (timeRemaining / question.timeMs) * 100;

  const handleSubmit = () => {
    if (feedback) return;
    const remaining = Math.max(0, timeRemaining);
    const ok = validateAnswer(question, input);
    if (ok) {
      setFeedback("ok");
      audio.playCorrect();
      setTimeout(() => goNextOnce(remaining), FEEDBACK_OK_MS);
    } else {
      pendingRemainingRef.current = remaining;
      setFeedback("bad");
      audio.playWrong();
    }
  };

  return (
    <ScreenShell
      variant="quiz"
      className="quiz-round"
      level={level}
      credits={roundState.creditsThisRound}
      badge="Quiz"
    >
      <div className="quiz-track-banner">
        <CheckeredFlagIcon size={20} />
        <span>{levelConfig.name}</span>
      </div>
      <div className="hw-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`hw-progress-segment ${i < questionIndex ? "done" : ""} ${i === questionIndex ? "current" : ""}`}
          />
        ))}
      </div>
      <div className="quiz-timer-row">
        <span className="quiz-question-count">
          Vraag {questionIndex + 1} / {questions.length}
        </span>
        <div className="hw-timer-bar" data-low={pct <= 25 ? "true" : undefined}>
          <div className="hw-timer-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div
        className={`hw-panel-question question-area ${
          feedback === "ok" ? "feedback-ok" : ""
        }`}
      >
        <QuestionDisplay question={question} />
        {feedback === "ok" && (
          <div className="hw-feedback-overlay ok" role="status">
            <span className="hw-feedback-badge">
              <CheckeredFlagIcon size={30} /> Goed!
            </span>
          </div>
        )}
      </div>
      <div className="hw-answer-row">
        <input
          ref={inputRef}
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
          disabled={feedback !== null}
        />
        <button
          type="button"
          className="hw-btn hw-btn-primary hw-answer-submit"
          onClick={handleSubmit}
          disabled={feedback !== null}
        >
          Antwoord
        </button>
      </div>
      <p className="hw-answer-hint">Druk op Enter om te bevestigen</p>

      {showWrongModal && (
        <QuizWrongAnswerModal
          question={question}
          onContinue={continueAfterWrong}
        />
      )}
    </ScreenShell>
  );
}
