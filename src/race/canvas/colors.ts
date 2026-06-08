export const COLORS = {
  skyTop: "#009CDE",
  skyBottom: "#87CEEB",
  trackOrange: "#FF6B00",
  trackHighlight: "#FF8C33",
  trackShadow: "#CC5500",
  boosterBlue: "#0072CE",
  boosterLight: "#009CDE",
  finishGreen: "#22C55E",
  flame: "#DA291C",
  yellow: "#FFE600",
  dark: "#1A1A2E",
  white: "#FFFFFF",
  speedLine: "#FFE600",
} as const;

export const CAR_COLORS: Record<string, { body: string; accent: string }> = {
  "booster-blaze": { body: "#FF2D00", accent: "#FFE600" },
  "grip-gt": { body: "#0072CE", accent: "#FFE600" },
  "jump-jet": { body: "#FFE600", accent: "#DA291C" },
  "loop-king": { body: "#9B59B6", accent: "#FFE600" },
  "rocket-racer": { body: "#2ECC71", accent: "#DA291C" },
};
