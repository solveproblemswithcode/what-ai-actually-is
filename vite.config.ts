import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The public address of the site, used for the social preview tags. Empty while developing.
process.env.VITE_SITE_URL ??= "";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2022", chunkSizeWarningLimit: 1200 },
});
