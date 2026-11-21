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
