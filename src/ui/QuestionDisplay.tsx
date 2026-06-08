import type { Question } from "../questions/types";
import { ClockVisual } from "./ClockVisual";
import { MoneyVisual } from "./MoneyVisual";
import { MeasureVisual } from "./MeasureVisual";

interface Props {
  question: Question;
}

export function QuestionDisplay({ question }: Props) {
  return (
    <div className="hw-panel question-panel">
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
        .question-prompt { font-size: 1.35rem; text-align: center; margin: 0 0 0.5rem; }
        .visual-clock.analog { width: 140px; height: 140px; display: block; margin: 0 auto; }
        .visual-clock.digital {
          font-size: 2.5rem; font-weight: 700; text-align: center;
          color: var(--hw-yellow); font-family: monospace;
          padding: 1rem; background: #000; border-radius: 8px;
          max-width: 200px; margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
