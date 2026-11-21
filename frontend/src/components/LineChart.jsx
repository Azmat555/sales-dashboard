import { inr, num, short, monthName } from "../format.js";

const W = 960, H = 300, L = 60, R = 44, T = 40, B = 36;

export default function LineChart({ id, rows }) {
  if (!rows.length) return <div id={id}><p className="empty">No orders match the selected filters.</p></div>;

  const iw = W - L - R, ih = H - T - B;
  const max = Math.max(...rows.map((r) => r.revenue), 4);
  const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const n = Math.ceil(max / step), top = n * step;            // round axis: 0, step, 2*step ...
  const x = (i) => L + (rows.length === 1 ? iw / 2 : (i * iw) / (rows.length - 1));
  const y = (v) => T + ih - (v / top) * ih;

  const points = rows.map((r, i) => `${x(i)},${y(r.revenue)}`).join(" ");
  const area = `${x(0)},${y(0)} ${points} ${x(rows.length - 1)},${y(0)}`;

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly net revenue">
        {Array.from({ length: n + 1 }, (_, k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(step * k)} y2={y(step * k)} stroke="#e3e8ef" />
            <text x={L - 8} y={y(step * k) + 4} textAnchor="end">{short(step * k)}</text>
          </g>
        ))}
        <polygon points={area} fill="#2f5bea" fillOpacity=".10" />
        <polyline points={points} fill="none" stroke="#2f5bea" strokeWidth="2.5" strokeLinejoin="round" />
        {rows.map((r, i) => (
          <g key={r.month}>
            <circle cx={x(i)} cy={y(r.revenue)} r="4.5" fill="#2f5bea">
              <title>{`${monthName(r.month)}: ${inr(r.revenue)} (${num(r.orders)} orders)`}</title>
            </circle>
            <text x={x(i)} y={y(r.revenue) - 10} textAnchor="middle" style={{ fill: "#1b2430" }}>{short(r.revenue)}</text>
            <text x={x(i)} y={H - 10} textAnchor="middle">{monthName(r.month)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
