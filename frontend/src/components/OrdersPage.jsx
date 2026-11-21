import { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../api.js";
import { inr, num } from "../format.js";

const statusClass = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Returned: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const load = () => {
    const controller = new AbortController();
    setLoading(true);
    fetchOrders({ search, status, limit: 500 }, controller.signal)
      .then((rows) => { setOrders(rows); setError(""); })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(() => {
    const abort = load();
    return abort;
  }, [search, status]);

  const changeStatus = async (orderId, newStatus) => {
    setSaving(orderId); setError("");
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((rows) => rows.map((row) => row.Order_ID === orderId ? updated : row));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving("");
    }
  };

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-xl font-semibold text-[#1b2430]">Orders</h1><p className="mt-1 text-xs text-[#6b7685]">View and manage recent orders</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…"
            className="w-full rounded-md border border-[#cfd6e2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f5bea] sm:w-64" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-[#cfd6e2] bg-white px-3 py-2 text-sm text-[#1b2430]">
            <option value="">All statuses</option><option>Completed</option><option>Returned</option><option>Cancelled</option>
          </select>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-[#fdecea] p-3 text-sm text-[#8a2c25]">Could not manage orders: {error}</p>}
      <div className="overflow-x-auto rounded-[10px] border border-[#e3e8ef] bg-white">
        <table className="w-full min-w-160 border-collapse text-left text-xs sm:text-sm">
          <thead><tr className="border-b border-[#e3e8ef] bg-[#f7f9fc] text-[#6b7685]">
            <th className="px-3 py-3 font-medium">Order</th><th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Customer</th><th className="px-3 py-3 font-medium">Product</th>
            <th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 text-right font-medium">Qty</th>
            <th className="px-3 py-3 text-right font-medium">Amount</th><th className="px-3 py-3 font-medium">Payment</th>
            <th className="px-3 py-3 font-medium">Status</th>
          </tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan="9" className="px-3 py-6 text-center text-[#6b7685]">Loading orders…</td></tr>
          ) : orders.map((o) => (
            <tr key={o.Order_ID} className="border-b border-[#edf0f6] last:border-0">
              <td className="px-3 py-3 font-medium text-[#1b2430]">{o.Order_ID}</td>
              <td className="px-3 py-3">{o.Order_Date}</td>
              <td className="px-3 py-3"><p className="font-medium">{o.Customer_Name}</p><p className="text-xs text-[#6b7685]">{o.Customer_ID}</p></td>
              <td className="max-w-48 px-3 py-3"><span className="block truncate" title={o.Product_Name}>{o.Product_Name}</span></td>
              <td className="px-3 py-3">{o.Category}</td><td className="px-3 py-3 text-right tabular-nums">{num(o.Quantity)}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums">{inr(o.Net_Amount_INR)}</td>
              <td className="px-3 py-3">{o.Payment_Method}</td>
              <td className="px-3 py-3"><select value={o.Order_Status} disabled={saving === o.Order_ID}
                onChange={(e) => changeStatus(o.Order_ID, e.target.value)}
                className={`rounded-full border-0 px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[o.Order_Status] || "bg-slate-50 text-slate-700 ring-slate-600/20"}`}>
                <option>Completed</option><option>Returned</option><option>Cancelled</option>
              </select></td>
            </tr>
          ))}</tbody>
        </table>
        {!loading && orders.length === 0 && <p className="p-6 text-center text-sm text-[#6b7685]">No orders found.</p>}
      </div>
    </section>
  );
}
