import type { QuestionVisualData } from "../questions/types";

interface Props {
  data: QuestionVisualData;
}

export function MeasureVisual({ data }: Props) {
  const value = data.measureValue ?? 5;
  const max = 10;
  const pct = (value / max) * 100;
  return (
    <div className="visual-measure" role="img" aria-label={`${value} liter`}>
      <div className="glass">
        <div className="water" style={{ height: `${pct}%` }} />
        <span className="label">{value} L</span>
      </div>
      <style>{`
        .visual-measure { display: flex; justify-content: center; margin: 1rem 0; }
        .glass {
          position: relative; width: 80px; height: 140px;
          border: 3px solid #88c; border-radius: 0 0 12px 12px;
          background: rgba(255,255,255,0.1); overflow: hidden;
        }
        .water {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(180deg, #4fc3f7, #0288d1);
        }
        .label {
          position: absolute; inset: 0; display: flex; align-items: center;
          justify-content: center; font-weight: 700; text-shadow: 0 1px 2px #000;
        }
      `}</style>
    </div>
  );
}
