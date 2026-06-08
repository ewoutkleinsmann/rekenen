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
        .visual-money { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 1rem 0; }
        .coin {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #ffd100, #c9a000);
          color: #333; font-weight: 700; font-size: 0.75rem;
          border: 3px solid #b8860b;
        }
      `}</style>
    </div>
  );
}
