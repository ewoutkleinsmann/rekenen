interface Props {
  className?: string;
  width?: number;
}

export function HotWheelsLogo({ className, width = 320 }: Props) {
  return (
    <img
      src="/assets/brand/hot-wheels-logo.svg"
      alt="Hot Wheels"
      className={className}
      width={width}
      draggable={false}
    />
  );
}
