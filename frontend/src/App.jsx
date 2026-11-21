import { useState } from "react";
import { useDashboard, useFilterOptions } from "./hooks/useDashboard.js";
import Filters from "./components/Filters.jsx";
import KpiCard from "./components/KpiCard.jsx";
import LineChart from "./components/LineChart.jsx";
import BarList from "./components/BarList.jsx";
import { inr, num } from "./format.js";

const EMPTY = { date_from: "", date_to: "", category: "", segment: "", city: "", status: "" };
const STATUS_COLORS = { Completed: "#1f9d6b", Returned: "#e0971d", Cancelled: "#c2554d" };

export default function App() {
  const [filters, setFilters] = useState(EMPTY);
  const [view, setView] = useState("segment");
  const { options, error: optionsError } = useFilterOptions();
  const { data, error } = useDashboard(filters);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const message = error || optionsError;
  const k = data?.kpis;

  return (
    <>
      <header>
        <h1>Sales Dashboard</h1>
        <p className="sub">Net revenue in INR &middot; source: <code>vw_sales</code> (customers &#8904; orders)</p>
      </header>

      {options && <Filters filters={filters} options={options} onChange={setFilter} onReset={() => setFilters(EMPTY)} />}
      {message && <div id="error" className="error">Could not load data: {message}</div>}

      {k && (
        <>
          <section className="kpis">
            <KpiCard id="k_rev" label="Total net revenue" value={inr(k.net_revenue)} hint={`Incl. ${inr(k.returned_revenue)} from returned orders`} />
            <KpiCard id="k_ord" label="Total orders" value={num(k.total_orders)} hint={`${num(k.non_cancelled_orders)} non-cancelled \u00B7 ${num(k.returned_orders)} returned`} />
            <KpiCard id="k_cus" label="Unique customers" value={num(k.unique_customers)} hint="Distinct customers with orders" />
            <KpiCard id="k_aov" label="Average order value" value={inr(k.average_order_value)} hint="Net revenue ÷ non-cancelled orders" />
            <KpiCard id="k_rep" label="Repeat customers" value={num(k.repeat_customers)} hint={`${(k.repeat_rate * 100).toFixed(1)}% of buyers (2+ non-cancelled orders)`} />
          </section>

          <main className="grid">
            <section className="card wide"><h2>Monthly revenue trend</h2><LineChart id="c_month" rows={data.monthly} /></section>
            <section className="card"><h2>Revenue by product category</h2><BarList id="c_cat" rows={data.by_category} /></section>
            <section className="card">
              <div className="head">
                <h2 id="seg_title">{view === "segment" ? "Revenue by customer segment" : "Revenue by city"}</h2>
                <div className="toggle">
                  <button id="t_seg" type="button" className={view === "segment" ? "on" : ""} onClick={() => setView("segment")}>Segment</button>
                  <button id="t_city" type="button" className={view === "city" ? "on" : ""} onClick={() => setView("city")}>City</button>
                </div>
              </div>
              <BarList id="c_seg" rows={view === "segment" ? data.by_segment : data.by_city} />
            </section>
            <section className="card">
              <h2>Order count by status</h2>
              <BarList id="c_status" rows={data.by_status} valueKey="orders" colors={STATUS_COLORS} />
              <p className="note">Returned orders stay in revenue; filter by status to isolate them.</p>
            </section>
            <section className="card"><h2>Top 5 products by revenue</h2><BarList id="c_top" rows={data.top_products} /></section>
          </main>
        </>
      )}
      {!k && !message && <p className="empty">Loading…</p>}
    </>
  );
}
