import { inr, num } from "../format.js";

const statusClass = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Returned: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function CustomerDetails({ data, onBack }) {
  const { customer, summary, orders } = data;

  return (
    <div className="min-w-0 space-y-4">
      <button type="button" onClick={onBack} className="rounded-md border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-medium text-[#1b2430]">
        ← Back to customers
      </button>

      <section className="grid min-w-0 gap-3 rounded-[10px] border border-[#e3e8ef] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:col-span-4">
          <p className="text-xs font-medium text-[#6b7685]">Customer {customer.Customer_ID}</p>
          <h2 className="mt-1 wrap-break-word text-xl font-semibold text-[#1b2430]">{customer.Customer_Name}</h2>
        </div>
        <Info label="Email" value={customer.Email} />
        <Info label="Location" value={`${customer.City}, ${customer.State}`} />
        <Info label="Segment" value={customer.Customer_Segment} />
        <Info label="Acquisition channel" value={customer.Acquisition_Channel} />
        <Info label="Joined" value={customer.Join_Date} />
        <Info label="Lifetime value" value={inr(summary.lifetime_value)} />
        <Info label="Total orders" value={num(summary.order_count)} />
        <Info label="Last order" value={summary.last_order_date || "No orders"} />
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Completed" value={summary.completed_orders} />
        <Mini label="Returned" value={summary.returned_orders} />
        <Mini label="Cancelled" value={summary.cancelled_orders} />
        <Mini label="Lifetime value" value={inr(summary.lifetime_value)} />
      </section>

      <section className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3 sm:p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#1b2430]">Order history</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-[#6b7685]">This customer has not placed any orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs sm:text-sm">
              <thead><tr className="border-b border-[#e3e8ef] text-[#6b7685]">
                <th className="px-2 py-2 font-medium">Order</th><th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Product</th><th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 text-right font-medium">Qty</th><th className="px-2 py-2 text-right font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Payment</th><th className="px-2 py-2 font-medium">Status</th>
              </tr></thead>
              <tbody>{orders.map((order) => (
                <tr key={order.Order_ID} className="border-b border-[#edf0f6] last:border-0">
                  <td className="px-2 py-3 font-medium text-[#1b2430]">{order.Order_ID}</td>
                  <td className="px-2 py-3">{order.Order_Date}</td>
                  <td className="max-w-48 px-2 py-3"><span className="block truncate" title={order.Product_Name}>{order.Product_Name}</span></td>
                  <td className="px-2 py-3">{order.Category}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{order.Quantity}</td>
                  <td className="px-2 py-3 text-right font-medium tabular-nums">{inr(order.Net_Amount_INR)}</td>
                  <td className="px-2 py-3">{order.Payment_Method}</td>
                  <td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[order.Order_Status] || "bg-slate-50 text-slate-700 ring-slate-600/20"}`}>{order.Order_Status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="min-w-0 rounded-lg bg-[#f7f9fc] p-3"><p className="text-xs text-[#6b7685]">{label}</p><p className="mt-1 wrap-break-word text-sm font-medium text-[#1b2430]">{value}</p></div>;
}

function Mini({ label, value }) {
  return <div className="min-w-0 rounded-[10px] border border-[#e3e8ef] bg-white p-3"><p className="text-xs text-[#6b7685]">{label}</p><p className="mt-1 wrap-break-word text-lg font-semibold text-[#1b2430]">{value}</p></div>;
}
