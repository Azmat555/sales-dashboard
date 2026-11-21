import { inr, num } from "../format.js";

/** Horizontal bar list. valueKey "revenue" (default) or "orders". */
export default function BarList({ id, rows, valueKey = "revenue", colors = {} }) {
  if (!rows.length) return <div id={id}><p className="empty">No orders match the selected filters.</p></div>;
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);
  return (
    <div id={id}>
      {rows.map((r) => (
        <div className="row" key={r.label}>
          <div className="lbl" title={r.label}>{r.label}</div>
          <div className="track">
            <div className="bar" style={{ width: `${(r[valueKey] / max) * 100}%`, background: colors[r.label] || "#2f5bea" }} />
          </div>
          <div className="val">
            {valueKey === "orders"
              ? `${num(r.orders)} orders`
              : <>{inr(r.revenue)} <small>{num(r.orders)} orders</small></>}
          </div>
        </div>
      ))}
    </div>
  );
}
