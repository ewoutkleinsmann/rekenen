const SEGMENT_SRC: Record<string, string> = {
  straight: "/assets/icons/straight.svg",
  curve: "/assets/icons/curve.svg",
  booster: "/assets/icons/booster.svg",
  loop: "/assets/icons/loop.svg",
  jump: "/assets/icons/jump.svg",
  rocket: "/assets/icons/rocket.svg",
};

interface Props {
  type: string;
  size?: number;
  className?: string;
}

export function SegmentIcon({ type, size = 32, className }: Props) {
  const src = SEGMENT_SRC[type] ?? SEGMENT_SRC.straight;
  return (
    <img
      src={src}
      alt={type}
      width={size}
      height={size}
      className={className}
      draggable={false}
      title={type}
    />
  );
}
