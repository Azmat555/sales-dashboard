import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: `npm run dev` serves the UI on :5173 and proxies /api to FastAPI on :8000.
// Build: `npm run build` writes frontend/dist, which FastAPI serves in production.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8000" } },
  build: { outDir: "dist" },
});
