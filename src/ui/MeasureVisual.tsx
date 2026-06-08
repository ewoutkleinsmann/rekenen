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
          border: 3px solid var(--hw-orange, #ff6b00);
          border-radius: 0 0 12px 12px;
          background: rgba(255,255,255,0.15); overflow: hidden;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
        }
        .water {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(180deg, var(--hw-light-blue, #009cde), var(--hw-blue, #0072ce));
        }
        .label {
          position: absolute; inset: 0; display: flex; align-items: center;
          justify-content: center; font-family: Rajdhani, sans-serif;
          font-weight: 700; font-size: 1.1rem;
          color: var(--hw-dark, #1a1a2e); text-shadow: 0 1px 2px rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}
