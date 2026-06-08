interface Props {
  size?: number;
  className?: string;
}

export function TrophyIcon({ size = 48, className }: Props) {
  return (
    <img
      src="/assets/icons/trophy.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
