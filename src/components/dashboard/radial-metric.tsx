/** A small SVG ring chart for a percentage metric — pure CSS/SVG, no charting library needed.
 * The ring fills in on mount via a CSS transition on stroke-dashoffset (see .radial-metric-value
 * in globals.css), so it reads as "live" rather than a static number. */
export function RadialMetric({
  percent,
  size = 56,
  strokeWidth = 6,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="radial-metric"
      role="img"
      aria-label={`${clamped}%`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="radial-metric-value"
        style={{ "--radial-dasharray": circumference } as React.CSSProperties}
      />
    </svg>
  );
}
