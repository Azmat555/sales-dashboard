// Thin wrapper around the FastAPI endpoints.
async function getJson(url, signal) {
  const res = await fetch(url, { signal });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok) throw new Error(body?.detail || `Request failed (${res.status})`);
  return body;
}

export const fetchFilterOptions = (signal) => getJson("/api/filters", signal);

export function fetchDashboard(filters, signal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  return getJson(`/api/dashboard?${params.toString()}`, signal);
}

export function fetchCustomers(search = "", signal) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  return getJson(`/api/customers?${params.toString()}`, signal);
}

export function fetchCustomer(customerId, signal) {
  return getJson(`/api/customers/${encodeURIComponent(customerId)}`, signal);
}

export function fetchOrders({ search = "", status = "", limit = 500 } = {}, signal) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  return getJson(`/api/orders?${params.toString()}`, signal);
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok) throw new Error(body?.detail || `Request failed (${res.status})`);
  return body;
}
