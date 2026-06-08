import type { QuestionVisualData } from "../questions/types";

const COIN_LABELS: Record<number, string> = {
  5: "5ct",
  10: "10ct",
  20: "20ct",
  50: "50ct",
};

interface Props {
  data: QuestionVisualData;
}

export function MoneyVisual({ data }: Props) {
  const coins = data.coins ?? [];
  return (
    <div className="visual-money" role="img" aria-label="Munten">
      {coins.map((value, i) => (
        <span key={i} className="coin" data-value={value}>
          {COIN_LABELS[value] ?? `${value}ct`}
        </span>
      ))}
      <style>{`
        .visual-money { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 1rem 0; }
        .coin {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, var(--hw-yellow, #ffe600), #c9a000);
          color: var(--hw-dark, #1a1a2e); font-family: Rajdhani, sans-serif;
          font-weight: 700; font-size: 0.75rem;
          border: 3px solid var(--hw-orange, #ff6b00);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
}
