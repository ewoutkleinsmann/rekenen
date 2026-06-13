import { useEffect, useRef } from "react";
import type { Question } from "../questions/types";
import {
  explainCorrectAnswer,
  clockAnswerHints,
} from "../questions/explainAnswer";
import { formatCorrectAnswer } from "../questions/formatAnswer";

const AUTO_CONTINUE_MS = 8500;

interface Props {
  question: Question;
  onContinue: () => void;
}

export function QuizWrongAnswerModal({ question, onContinue }: Props) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(onContinue, AUTO_CONTINUE_MS);
    return () => window.clearTimeout(id);
  }, [onContinue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  const answer = formatCorrectAnswer(question);
  const explanation = explainCorrectAnswer(question);
  const clockHint = clockAnswerHints(question);

  return (
    <div className="hw-quiz-modal-backdrop" role="presentation">
      <div
        className="hw-quiz-modal hw-chrome-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-wrong-title"
      >
        <p className="hw-quiz-modal-kicker">Niet helemaal goed</p>
        <h2 id="quiz-wrong-title" className="hw-quiz-modal-title">
          Mis!
        </h2>
        <div className="hw-quiz-modal-answer-block">
          <span className="hw-quiz-modal-label">Goed antwoord</span>
          <p className="hw-quiz-modal-answer">{answer}</p>
        </div>
        <p className="hw-quiz-modal-explain">{explanation}</p>
        {clockHint && <p className="hw-quiz-modal-hint">{clockHint}</p>}
        <button
          ref={continueRef}
          type="button"
          className="hw-btn hw-btn-primary hw-btn-racing hw-quiz-modal-continue"
          onClick={onContinue}
        >
          Volgende vraag
        </button>
        <p className="hw-quiz-modal-auto">
          Gaat vanzelf door over een paar seconden — of druk Enter
        </p>
      </div>
    </div>
  );
}
