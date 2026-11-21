import { useEffect, useState } from "react";
import { fetchDashboard, fetchFilterOptions } from "../api.js";

/** Loads dashboard data whenever the filters change; stale requests are aborted. */
export function useDashboard(filters) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(filters, controller.signal)
      .then((data) => setState({ data, error: null }))
      .catch((e) => { if (e.name !== "AbortError") setState((s) => ({ ...s, error: e.message })); });
    return () => controller.abort();
  }, [filters]);
  return state;
}

/** Loads the distinct values for the filter dropdowns once. */
export function useFilterOptions() {
  const [state, setState] = useState({ options: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetchFilterOptions(controller.signal)
      .then((options) => setState({ options, error: null }))
      .catch((e) => { if (e.name !== "AbortError") setState({ options: null, error: e.message }); });
    return () => controller.abort();
  }, []);
  return state;
}
