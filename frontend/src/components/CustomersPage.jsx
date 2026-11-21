import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCustomer, fetchCustomers } from "../api.js";
import { inr, num } from "../format.js";
import CustomerDetails from "./CustomerDetails.jsx";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { customerId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchCustomers(search, controller.signal)
      .then((rows) => { setCustomers(rows); setError(""); })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);

  useEffect(() => {
    if (!customerId) { setDetail(null); return; }
    const controller = new AbortController();
    setDetail(null); setError("");
    fetchCustomer(customerId, controller.signal)
      .then(setDetail)
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [customerId]);

  const handleRowClick = (id) => {
    navigate(`/customers/${encodeURIComponent(id)}`);
  };

  if (customerId) {
    return detail ? <CustomerDetails data={detail} onBack={() => navigate("/customers")} /> : (
      <p className="rounded-lg border border-[#e3e8ef] bg-white p-4 text-sm text-[#6b7685]">{error || "Loading customer…"}</p>
    );
  }

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-xl font-semibold text-[#1b2430]">Customers</h1><p className="mt-1 text-xs text-[#6b7685]">Complete customer directory</p></div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…"
          className="w-full rounded-md border border-[#cfd6e2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f5bea] sm:w-72" />
      </div>

      {error && <p className="mb-3 rounded-lg bg-[#fdecea] p-3 text-sm text-[#8a2c25]">Could not load customers: {error}</p>}
      <div className="overflow-x-auto rounded-[10px] border border-[#e3e8ef] bg-white">
        <table className="w-full min-w-225 border-collapse text-left text-xs sm:text-sm">
          <thead><tr className="border-b border-[#e3e8ef] bg-[#f7f9fc] text-[#6b7685]">
            <th className="px-3 py-3 font-medium">Customer</th><th className="px-3 py-3 font-medium">Email</th>
            <th className="px-3 py-3 font-medium">Location</th><th className="px-3 py-3 font-medium">Segment</th>
            <th className="px-3 py-3 font-medium">Joined</th><th className="px-3 py-3 text-right font-medium">Orders</th>
            <th className="px-3 py-3 text-right font-medium">Lifetime value</th><th className="px-3 py-3 font-medium">Last order</th>
          </tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan="8" className="px-3 py-6 text-center text-[#6b7685]">Loading customers…</td></tr>
          ) : customers.map((c) => (
            <tr key={c.Customer_ID} onClick={() => handleRowClick(c.Customer_ID)} className="cursor-pointer border-b border-[#edf0f6] last:border-0 hover:bg-[#f7f9fc]">
              <td className="px-3 py-3"><p className="font-medium text-[#1b2430]">{c.Customer_Name}</p><p className="text-xs text-[#6b7685]">{c.Customer_ID}</p></td>
              <td className="max-w-48 px-3 py-3"><span className="block truncate" title={c.Email}>{c.Email}</span></td>
              <td className="px-3 py-3">{c.City}, {c.State}</td><td className="px-3 py-3">{c.Customer_Segment}</td>
              <td className="px-3 py-3">{c.Join_Date}</td><td className="px-3 py-3 text-right tabular-nums">{num(c.order_count)}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums">{inr(c.lifetime_value)}</td>
              <td className="px-3 py-3">{c.last_order_date || "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {!loading && customers.length === 0 && <p className="p-6 text-center text-sm text-[#6b7685]">No customers found.</p>}
      </div>
    </section>
  );
}
