import type { Question } from "../questions/types";
import { ClockVisual } from "./ClockVisual";
import { MoneyVisual } from "./MoneyVisual";
import { MeasureVisual } from "./MeasureVisual";

interface Props {
  question: Question;
}

export function QuestionDisplay({ question }: Props) {
  return (
    <div className="question-panel">
      <p className="question-prompt">{question.prompt}</p>
      {question.display === "clock" && question.visualData && (
        <ClockVisual data={question.visualData} />
      )}
      {question.display === "money" && question.visualData && (
        <MoneyVisual data={question.visualData} />
      )}
      {question.display === "measure" && question.visualData && (
        <MeasureVisual data={question.visualData} />
      )}
      <style>{`
        .question-prompt {
          font-size: 1.35rem; text-align: center; margin: 0 0 0.5rem;
          font-family: Fredoka, sans-serif; font-weight: 600;
          color: var(--hw-question-text, #1a1a2e);
        }
      `}</style>
    </div>
  );
}
