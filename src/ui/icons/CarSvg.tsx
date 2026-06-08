interface Props {
  carId: string;
  width?: number;
  className?: string;
}

export function CarSvg({ carId, width = 140, className }: Props) {
  const height = Math.round(width * 0.45);
  return (
    <img
      src={`/assets/cars/${carId}.svg`}
      alt=""
      aria-hidden
      width={width}
      height={height}
      className={className}
      draggable={false}
      style={{ objectFit: "contain" }}
    />
  );
}
