import { inr, num } from "../format.js";

/** Horizontal bar list. valueKey "revenue" (default) or "orders". */
export default function BarList({ id, rows, valueKey = "revenue", colors = {} }) {
  if (!rows.length) return <div id={id}><p className="mt-2 text-xs text-[#6b7685]">No orders match the selected filters.</p></div>;
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);
  return (
    <div id={id} className="min-w-0">
      {rows.map((r) => (
        <div className="my-1.5 grid min-w-0 grid-cols-[minmax(60px,0.7fr)_minmax(40px,1fr)] items-center gap-2 sm:grid-cols-[150px_minmax(40px,1fr)_minmax(90px,160px)]" key={r.label}>
          <div className="truncate text-xs sm:text-sm" title={r.label}>{r.label}</div>
          <div className="h-4 overflow-hidden rounded-md bg-[#edf0f6]">
            <div className="h-full rounded-md" style={{ width: `${(r[valueKey] / max) * 100}%`, background: colors[r.label] || "#2f5bea" }} />
          </div>
          <div className="col-span-2 text-right text-xs tabular-nums sm:col-span-1 sm:text-sm">
            {valueKey === "orders"
              ? `${num(r.orders)} orders`
              : <>{inr(r.revenue)} <small className="block text-[10px] text-[#6b7685] sm:inline sm:text-xs">{num(r.orders)} orders</small></>}
          </div>
        </div>
      ))}
    </div>
  );
}
