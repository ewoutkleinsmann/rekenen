import { useId } from "react";

interface Props {
  size?: number;
  className?: string;
}

export function WheelCreditIcon({ size = 24, className }: Props) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      role="img"
    >
      <defs>
        <radialGradient id={`${uid}-tire`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#1a1a1a" />
          <stop offset="88%" stopColor="#2d2d2d" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="30%" stopColor="#c0c0c0" />
          <stop offset="60%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>
        <linearGradient id={`${uid}-spoke`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe600" />
          <stop offset="100%" stopColor="#ff6b00" />
        </linearGradient>
        <radialGradient id={`${uid}-cap`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#da291c" />
        </radialGradient>
        <filter
          id={`${uid}-shadow`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.5" />
        </filter>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={`url(#${uid}-tire)`}
        filter={`url(#${uid}-shadow)`}
      />
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill={`url(#${uid}-rim)`}
        stroke="#888"
        strokeWidth="0.5"
      />
      {[0, 72, 144, 216, 288].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 32 32)`}>
          <path
            d="M32 14 L36 28 L32 32 L28 28 Z"
            fill={`url(#${uid}-spoke)`}
            stroke="#cc5500"
            strokeWidth="0.3"
          />
        </g>
      ))}
      <circle
        cx="32"
        cy="32"
        r="14"
        fill="none"
        stroke="#aaa"
        strokeWidth="1"
      />
      <circle
        cx="32"
        cy="32"
        r="10"
        fill={`url(#${uid}-cap)`}
        stroke="#ffe600"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="4" fill="#ffe600" />
      <path
        d="M32 22 C34 26 36 28 32 30 C28 28 30 26 32 22Z"
        fill="#ff6b00"
        opacity="0.8"
      />
      <ellipse cx="26" cy="24" rx="6" ry="4" fill="#fff" opacity="0.15" />
    </svg>
  );
}
