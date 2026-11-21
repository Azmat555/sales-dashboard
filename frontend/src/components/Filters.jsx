function Select({ id, label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-[#6b7685] min-[360px]:flex-none">
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(id, e.target.value)}
        className="min-w-0 w-full max-w-full rounded-md border border-[#cfd6e2] bg-white px-2 py-1.5 text-sm text-[#1b2430] outline-none focus:border-[#2f5bea] focus:ring-2 focus:ring-[#2f5bea]/20">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function Filters({ filters, options, onChange, onReset }) {
  const fieldClass = "min-w-0 w-full max-w-full rounded-md border border-[#cfd6e2] bg-white px-2 py-1.5 text-sm text-[#1b2430] outline-none focus:border-[#2f5bea] focus:ring-2 focus:ring-[#2f5bea]/20";

  return (
    <section className="flex flex-col sm:flex-row min-w-0 flex-wrap sm:items-end gap-2 rounded-[10px] border border-[#e3e8ef] bg-white p-3 sm:gap-3 sm:p-3.5" aria-label="Filters">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-[#6b7685] min-[360px]:flex-none">
        <span>From</span>
        <input type="date" id="date_from" value={filters.date_from} min={options.min_date} max={options.max_date}
          onChange={(e) => onChange("date_from", e.target.value)} className={fieldClass} />
      </label>
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-[#6b7685] min-[360px]:flex-none">
        <span>To</span>
        <input type="date" id="date_to" value={filters.date_to} min={options.min_date} max={options.max_date}
          onChange={(e) => onChange("date_to", e.target.value)} className={fieldClass} />
      </label>
      <Select id="category" label="Category" value={filters.category} options={options.categories} onChange={onChange} />
      <Select id="segment" label="Segment" value={filters.segment} options={options.segments} onChange={onChange} />
      <Select id="city" label="City" value={filters.city} options={options.cities} onChange={onChange} />
      <Select id="status" label="Order status" value={filters.status} options={options.statuses} onChange={onChange} />
      <button id="reset" type="button" onClick={onReset}
        className="w-full cursor-pointer rounded-md border border-[#2f5bea] bg-[#2f5bea] px-3 py-1.5 text-sm text-white sm:w-auto">Reset</button>
    </section>
  );
}
