import { defineConfig } from "@vite-pwa/assets-generator/config";

// Generates the PWA icon set from a full-bleed brand mark: the gradient fills
// the whole square so the platform can round the corners itself. We use no
// padding and no white background, which avoids the white frame you otherwise
// get around the installed app icon. Run with `npm run generate-icons`.
export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
    },
    maskable: {
      sizes: [512],
      padding: 0,
    },
    apple: {
      sizes: [180],
      padding: 0,
    },
  },
  images: ["public/pingloop-icon-fullbleed.svg"],
});
