import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/awesome-bench",
  server: {
    // Redirect /awesome-bench to /awesome-bench/
    middlewareMode: false,
  },
  appType: "spa",
});
