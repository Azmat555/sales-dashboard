import { useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useDashboard, useFilterOptions } from "./hooks/useDashboard.js";
import Filters from "./components/Filters.jsx";
import KpiCard from "./components/KpiCard.jsx";
import LineChart from "./components/LineChart.jsx";
import BarList from "./components/BarList.jsx";
import { inr, num } from "./format.js";
import CustomersPage from "./components/CustomersPage.jsx";
import OrdersPage from "./components/OrdersPage.jsx";
import NotFound from "./components/NotFound.jsx";

const EMPTY = { date_from: "", date_to: "", category: "", segment: "", city: "", status: "" };
const STATUS_COLORS = { Completed: "#1f9d6b", Returned: "#e0971d", Cancelled: "#c2554d" };

export default function App() {
  const location = useLocation();
  const navItems = [
    { path: "/home", label: "Overview", icon: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z" },
    { path: "/customers", label: "Customers", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
    { path: "/orders", label: "Orders", icon: "M6 2h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V4a2 2 0 0 1 2-2Zm3 5h6M9 11h6M9 15h4" },
  ];
  const pageTitle = location.pathname.startsWith("/customers")
    ? "Customers"
    : location.pathname.startsWith("/orders")
      ? "Orders"
      : "Sales overview";

  return (
    <div className="min-h-screen min-w-0 bg-[#f4f7fb] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-[#dde4ed] bg-[#101828] text-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex min-w-0 flex-col lg:h-full">
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-4 sm:px-5 lg:min-h-20">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2f5bea] text-sm font-bold shadow-lg shadow-blue-950/30">A</div>
            <div className="min-w-0">
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Admin console</p>
            </div>
          </div>

          <nav className="grid min-w-0 grid-cols-3 gap-1 p-2 sm:p-3 lg:flex lg:flex-1 lg:flex-col lg:gap-1.5 lg:p-4" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} title={item.label}
                className={({ isActive }) => `flex min-w-0 items-center justify-center gap-2.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm lg:justify-start lg:px-3 ${isActive ? "bg-[#2f5bea] text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 sm:size-4.5" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <span className="hidden truncate min-[360px]:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="hidden border-t border-white/10 p-4 lg:block">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dbe5ff] text-xs font-bold text-[#2448a8]">SA</div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">Sales Administrator</p>
                
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#dde4ed] bg-white/95 backdrop-blur lg:h-20">
          <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-5 lg:h-20 lg:px-7">
            <div className="min-w-0">
              
              <h1 className="truncate text-base font-bold text-[#1b2430] sm:text-xl">{pageTitle}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-[#1b2430]">Sales Admin</p>
                <p className="text-[11px] text-[#6b7685]">Administrator</p>
              </div>
              <div className="grid size-9 place-items-center rounded-full bg-[#dbe5ff] text-xs font-bold text-[#2448a8] ring-4 ring-[#f4f7fb]">SA</div>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-2 sm:p-5 lg:p-7">
          <div className="mx-auto min-w-0 max-w-400">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeDashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:customerId" element={<CustomersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function HomeDashboard() {
  const [filters, setFilters] = useState(EMPTY);
  const [view, setView] = useState("segment");
  const { options, error: optionsError } = useFilterOptions();
  const { data, error } = useDashboard(filters);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const message = error || optionsError;
  const k = data?.kpis;

  return (
    <>
      <header className="min-w-0">
        <h1 className="m-0 wrap-break-word text-xl font-semibold text-[#1b2430] sm:text-2xl">Dashboard Overview</h1>
        <p className="mt-0.5 mb-3.5 text-xs leading-relaxed text-[#6b7685] sm:text-sm">Net revenue in INR &middot; source: <code className="rounded bg-[#e9edf5] px-1.5 py-0.5 break-all text-xs text-[#1b2430]">vw_sales</code> (customers &#8904; orders)</p>
      </header>
      {options && <Filters filters={filters} options={options} onChange={setFilter} onReset={() => setFilters(EMPTY)} />}
      {message && <div id="error" className="mt-2.5 rounded-lg bg-[#fdecea] px-3 py-2.5 text-sm wrap-break-word text-[#8a2c25]">Could not load data: {message}</div>}

      {k && (
        <>
          <section className="my-3.5 grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-5">
            <KpiCard id="k_rev" label="Total net revenue" value={inr(k.net_revenue)} hint={`Incl. ${inr(k.returned_revenue)} from returned orders`} />
            
            <KpiCard id="k_ord" label="Total orders" value={num(k.total_orders)} hint={`${num(k.non_cancelled_orders)} non-cancelled · ${num(k.returned_orders)} returned`} />
            
            <KpiCard id="k_cus" label="Unique customers" value={num(k.unique_customers)} hint="Distinct customers with orders" />
            <KpiCard id="k_aov" label="Average order value" value={inr(k.average_order_value)} hint="Net revenue ÷ non-cancelled orders" />
            <KpiCard id="k_rep" label="Repeat customers" value={num(k.repeat_customers)} hint={`${(k.repeat_rate * 100).toFixed(1)}% of buyers (2+ non-cancelled orders)`} />
          </section>

          <main className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
           

            <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 md:p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#1b2430]">Revenue by product category</h2>
              <BarList id="c_cat" rows={data.by_category} />
            </section>

            <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 md:p-4">
              <div className="mb-3 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-start">
                <h2 id="seg_title" className="min-w-0 text-sm font-semibold wrap-break-word text-[#1b2430]">
                  {view === "segment" ? "Revenue by customer segment" : "Revenue by city"}
                </h2>
                <div className="flex shrink-0 self-start overflow-hidden rounded-md border border-[#cfd6e2]">
                  <button id="t_seg" type="button" className={`min-w-0 px-2 py-1.5 text-xs sm:px-2.5 ${view === "segment" ? "bg-[#2f5bea] text-white" : "bg-white text-[#1b2430]"}`} onClick={() => setView("segment")}>Segment</button>
                  <button id="t_city" type="button" className={`min-w-0 border-l border-[#cfd6e2] px-2 py-1.5 text-xs sm:px-2.5 ${view === "city" ? "bg-[#2f5bea] text-white" : "bg-white text-[#1b2430]"}`} onClick={() => setView("city")}>City</button>
                </div>
              </div>
              <BarList id="c_seg" rows={view === "segment" ? data.by_segment : data.by_city} />
            </section>

            <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 md:p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#1b2430]">Order count by status</h2>
              <BarList id="c_status" rows={data.by_status} valueKey="orders" colors={STATUS_COLORS} />
              <p className="mt-2 text-xs leading-relaxed text-[#6b7685]">Returned orders stay in revenue; filter by status to isolate them.</p>
            </section>

            <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 md:p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#1b2430]">Top 5 products by revenue</h2>
              <BarList id="c_top" rows={data.top_products} />
            </section>

             <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 md:col-span-2 md:p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#1b2430]">Monthly revenue trend</h2>
              <LineChart id="c_month" rows={data.monthly} />
            </section>
          </main>
        </>
      )}
      {!k && !message && <p className="mt-2 text-xs text-[#6b7685]">Loading…</p>}
    </>
  );
}
