function Select({ id, label, value, options, onChange }) {
  return (
    <label>
      {label}
      <select id={id} value={value} onChange={(e) => onChange(id, e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function Filters({ filters, options, onChange, onReset }) {
  return (
    <section className="filters" aria-label="Filters">
      <label>From
        <input type="date" id="date_from" value={filters.date_from} min={options.min_date} max={options.max_date}
               onChange={(e) => onChange("date_from", e.target.value)} />
      </label>
      <label>To
        <input type="date" id="date_to" value={filters.date_to} min={options.min_date} max={options.max_date}
               onChange={(e) => onChange("date_to", e.target.value)} />
      </label>
      <Select id="category" label="Category" value={filters.category} options={options.categories} onChange={onChange} />
      <Select id="segment" label="Segment" value={filters.segment} options={options.segments} onChange={onChange} />
      <Select id="city" label="City" value={filters.city} options={options.cities} onChange={onChange} />
      <Select id="status" label="Order status" value={filters.status} options={options.statuses} onChange={onChange} />
      <button id="reset" type="button" onClick={onReset}>Reset</button>
    </section>
  );
}
