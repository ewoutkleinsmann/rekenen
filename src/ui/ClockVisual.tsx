import type { QuestionVisualData } from "../questions/types";

interface Props {
  data: QuestionVisualData;
}

export function ClockVisual({ data }: Props) {
  const hour = data.clockHour ?? 12;
  const minute = data.clockMinute ?? 0;
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const minuteAngle = minute * 6 - 90;

  if (data.clockStyle === "digital") {
    const h = String(hour).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    return (
      <div className="visual-clock digital" aria-label={`Klok ${h}:${m}`}>
        <span>
          {h}:{m}
        </span>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="visual-clock analog" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="#fff"
        stroke="#333"
        strokeWidth="3"
      />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={60 + 45 * Math.cos(a - Math.PI / 2)}
            y1={60 + 45 * Math.sin(a - Math.PI / 2)}
            x2={60 + 50 * Math.cos(a - Math.PI / 2)}
            y2={60 + 50 * Math.sin(a - Math.PI / 2)}
            stroke="#333"
            strokeWidth="2"
          />
        );
      })}
      <line
        x1="60"
        y1="60"
        x2={60 + 28 * Math.cos((hourAngle * Math.PI) / 180)}
        y2={60 + 28 * Math.sin((hourAngle * Math.PI) / 180)}
        stroke="#0056b3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="60"
        x2={60 + 38 * Math.cos((minuteAngle * Math.PI) / 180)}
        y2={60 + 38 * Math.sin((minuteAngle * Math.PI) / 180)}
        stroke="#ff6b00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="4" fill="#333" />
    </svg>
  );
}
