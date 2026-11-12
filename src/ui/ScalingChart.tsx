/**
 * Chapter 1: the shape of the scaling-law graph (Kaplan et al. 2020, Figure 1), which Chloe Lubinski showed in her talk.
 * On log scales the error falls along a straight line. The dot follows the compute slider.
 */
export default function ScalingChart({ value }: { value: number }) {
  const W = 300, H = 74, L = 40, B = 16, T = 4, R = 8;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  // Error goes from high to low as compute rises (straight on a log-log chart).
  const err = (v: number) => 0.92 - 0.78 * v;
  // A few faint training runs, each flattening out before it meets the line: the curves from the original figure.
  const runs = [0.15, 0.32, 0.5, 0.68, 0.86].map((end) => {
    const pts: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const v = (end * i) / 16;
      const lift = Math.pow(1 - i / 16, 2.2) * 0.5;
      pts.push(`${x(v).toFixed(1)},${y(Math.min(1, err(v) + lift)).toFixed(1)}`);
    }
    return pts.join(" ");
  });
  return (
    <figure className="scaling" aria-label="Chart: as compute grows, error falls along a straight line">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
        <line x1={L} y1={T} x2={L} y2={H - B} className="axis" />
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} className="axis" />
        {runs.map((pts) => (
          <polyline key={pts} points={pts} className="run" />
        ))}
        <line x1={x(0)} y1={y(err(0))} x2={x(1)} y2={y(err(1))} className="law" />
        <circle cx={x(value)} cy={y(err(value))} r={5} className="dot" />
        <text x={L - 5} y={T + 9} textAnchor="end" className="tick">
          error
        </text>
        <text x={W - R} y={H - 4} textAnchor="end" className="tick">
          compute (each step is 10x more)
        </text>
      </svg>
      <figcaption>Every 10x more compute cuts the error by about the same fraction.</figcaption>
    </figure>
  );
}
