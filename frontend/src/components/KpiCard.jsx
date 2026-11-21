export default function KpiCard({ id, label, value, hint }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3.5 sm:p-4">
      <span className="text-xs text-[#6b7685]">{label}</span>
      <strong id={id} className="my-0.5 block wrap-break-word text-xl font-bold text-[#1b2430] sm:text-[26px]">{value}</strong>
      <small className="block text-xs leading-relaxed wrap-break-word text-[#6b7685]">{hint}</small>
    </div>
  );
}
