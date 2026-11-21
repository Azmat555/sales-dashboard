export default function KpiCard({ id, label, value, hint }) {
  return (
    <div className="card kpi">
      <span>{label}</span>
      <strong id={id}>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
