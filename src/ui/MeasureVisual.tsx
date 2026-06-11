import type { QuestionVisualData } from "../questions/types";

interface Props {
  data: QuestionVisualData;
}

export function MeasureVisual({ data }: Props) {
  const value = data.measureValue ?? 5;
  const max = data.measureMax ?? 10;
  const unit = data.measureUnit ?? "L";
  const labelStep = max <= 12 ? 2 : 5;
  const pct = (value / max) * 100;

  const ticks = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className="visual-measure" role="img" aria-label="Maatbeker met water">
      <div className="beaker">
        <div className="water" style={{ height: `${pct}%` }}>
          <span className="water-surface" />
        </div>
        <div className="scale">
          {ticks.map((i) => {
            const major = i % labelStep === 0;
            return (
              <div
                key={i}
                className={`tick ${major ? "major" : ""}`}
                style={{ bottom: `${(i / max) * 100}%` }}
              >
                {major && i > 0 && (
                  <span className="tick-label">
                    {i}
                    {i === max ? ` ${unit}` : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .visual-measure { display: flex; justify-content: center; margin: 1rem 0; }
        .beaker {
          position: relative; width: 96px; height: 200px;
          border: 3px solid #cbd5e1;
          border-top: none;
          border-radius: 0 0 14px 14px;
          background:
            linear-gradient(110deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 60%),
            rgba(180, 205, 230, 0.12);
          box-shadow: inset 0 0 16px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        .water {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(180deg, var(--hw-light-blue, #009cde), var(--hw-blue, #0072ce));
          transition: height 0.4s ease;
        }
        .water-surface {
          position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
        }
        .scale { position: absolute; inset: 0; pointer-events: none; }
        .tick {
          position: absolute; left: 0; height: 0;
          border-top: 2px solid rgba(26,26,46,0.35);
          width: 14px;
        }
        .tick.major {
          width: 26px;
          border-top-color: rgba(26,26,46,0.75);
        }
        .tick-label {
          position: absolute; left: 30px; top: -0.7em;
          font-family: Rajdhani, sans-serif; font-weight: 700;
          font-size: 0.8rem; color: var(--hw-question-text, #1a1a2e);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
