// The signature visual: a semicircular quality-score gauge, red -> amber ->
// teal, with a needle pointing at the score. Used in the landing hero (as
// an illustration) and in the dashboard's diagnosis result (with a real
// score). Pure SVG, no dependencies.

interface GaugeProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

export default function Gauge({ score, size = 200, label }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = -90 + (clamped / 100) * 180; // -90deg (left) to +90deg (right)
  const rad = (angle * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const needleX = cx + r * Math.sin(rad);
  const needleY = cy - r * Math.cos(rad);

  return (
    <svg viewBox={`0 0 ${size} ${size * 0.62}`} width={size} height={size * 0.62}>
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-alert)" />
          <stop offset="50%" stopColor="var(--color-amber)" />
          <stop offset="100%" stopColor="var(--color-signal)" />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={size * 0.06}
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="var(--color-ink)"
        strokeWidth={size * 0.015}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={size * 0.02} fill="var(--color-ink)" />
      <text
        x={cx}
        y={cy - size * 0.12}
        textAnchor="middle"
        className="font-display"
        fontSize={size * 0.16}
        fontWeight={600}
        fill="var(--color-ink)"
      >
        {Math.round(clamped)}
      </text>
      {label && (
        <text
          x={cx}
          y={cy + size * 0.02}
          textAnchor="middle"
          className="font-mono"
          fontSize={size * 0.06}
          fill="var(--color-slate)"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
