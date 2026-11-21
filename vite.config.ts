import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // "/" locally; CI sets GHPAGES_BASE=/MacroTrackro/ for GitHub Pages
  base: process.env.GHPAGES_BASE || "/",
  plugins: [
    react(),
    {
      // The CSP in index.html is for the built site. The dev server needs inline scripts and a
      // websocket for hot reload, so it is dropped there; `npm run preview` runs with it.
      name: "no-csp-in-dev",
      apply: "serve",
      transformIndexHtml: (html) => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, ""),
    },
  ],
});
