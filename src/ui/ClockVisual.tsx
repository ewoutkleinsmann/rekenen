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
        <style>{`
          .visual-clock.digital {
            position: relative;
            font-size: 3rem; font-weight: 700; text-align: center;
            letter-spacing: 0.06em;
            color: var(--hw-yellow, #ffe600);
            font-family: Rajdhani, sans-serif;
            font-variant-numeric: tabular-nums;
            padding: 1rem 1.5rem;
            background: linear-gradient(165deg, #20253c 0%, #11152a 100%);
            border: 1px solid rgba(255, 140, 0, 0.5);
            border-radius: 14px;
            max-width: 240px; margin: 0 auto;
            text-shadow: 0 0 12px rgba(255, 230, 0, 0.55);
            box-shadow:
              0 8px 20px -6px rgba(0, 0, 0, 0.6),
              inset 0 2px 8px rgba(0, 0, 0, 0.6),
              inset 0 0 0 1px rgba(255, 255, 255, 0.04);
          }
        `}</style>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className="visual-clock analog"
      aria-hidden
      style={{ width: 140, height: 140, display: "block", margin: "0 auto" }}
    >
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="#fff"
        stroke="#1a1a2e"
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke="#ff6b00"
        strokeWidth="1"
        opacity="0.3"
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
            stroke="#1a1a2e"
            strokeWidth="2"
          />
        );
      })}
      <line
        x1="60"
        y1="60"
        x2={60 + 28 * Math.cos((hourAngle * Math.PI) / 180)}
        y2={60 + 28 * Math.sin((hourAngle * Math.PI) / 180)}
        stroke="#0072ce"
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
      <circle cx="60" cy="60" r="4" fill="#da291c" />
    </svg>
  );
}
