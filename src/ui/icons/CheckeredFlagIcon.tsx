interface Props {
  size?: number;
  className?: string;
}

export function CheckeredFlagIcon({ size = 32, className }: Props) {
  return (
    <img
      src="/assets/icons/checkered-flag.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
