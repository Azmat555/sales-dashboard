export const inr = (n) => "\u20B9" + Math.round(n).toLocaleString("en-IN");
export const num = (n) => Math.round(n).toLocaleString("en-IN");

const trim = (s) => s.replace(/\.?0+$/, "");
export const short = (n) =>
  n >= 1e7 ? trim((n / 1e7).toFixed(2)) + " Cr"
  : n >= 1e5 ? trim((n / 1e5).toFixed(2)) + " L"
  : n >= 1e3 ? trim((n / 1e3).toFixed(1)) + "k"
  : String(Math.round(n));

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const monthName = (ym) => { const [y, m] = ym.split("-"); return `${MONTHS[+m - 1]} ${y}`; };
