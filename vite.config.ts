import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base must match the GitHub Pages path. For a project page served at
// https://<user>.github.io/PingLoop/ this is "/PingLoop/". Change it to "/"
// for a custom domain or a user/org page. start_url and scope below must match.
const base = "/PingLoop/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Icons are generated from public/pingloop-icon.svg by pwa-assets.config.ts
      // and injected into the manifest and the document head.
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: "PingLoop",
        short_name: "PingLoop",
        description:
          "Simple recurring reminders, timers, and productivity nudges.",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        id: base,
        start_url: base,
        scope: base,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
    }),
  ],
});
