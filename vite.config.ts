import { cloudflare } from "@cloudflare/vite-plugin";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "レシピリスト",
        short_name: "レシピ",
        lang: "ja",
        start_url: "/",
        display: "standalone",
        background_color: "#fffaf0",
        theme_color: "#593414",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // オフライン対応はしない。API は常にネットワークから取得する
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
