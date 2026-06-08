import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Generates the PWA icon set (192 / 512 / maskable / apple-touch) from the
// brand mark. Run with `npm run generate-icons`; vite-plugin-pwa also picks
// this up at build time and injects the icons into the manifest.
export default defineConfig({
  preset: minimal2023Preset,
  images: ["public/pingloop-icon.svg"],
});
