import type { ReactNode } from "react";
import { WheelCreditIcon } from "./icons";

type ScreenVariant = "title" | "quiz" | "shop" | "garage" | "race" | "result";

interface Props {
  variant: ScreenVariant;
  children: ReactNode;
  className?: string;
  level?: number;
  credits?: number;
  badge?: string;
}

export function ScreenShell({
  variant,
  children,
  className = "",
  level,
  credits,
  badge,
}: Props) {
  const showHud = credits !== undefined && variant !== "title";

  return (
    <div className={`screen-shell ${className}`} data-variant={variant}>
      {showHud && (
        <div className="hw-hud">
          <span className="hw-hud-left">
            {badge && <span className="hw-badge">{badge}</span>}
            {level !== undefined && (
              <span className="hw-hud-level">Level {level}</span>
            )}
          </span>
          <span className="hw-credits">
            <WheelCreditIcon size={24} />
            {credits}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
