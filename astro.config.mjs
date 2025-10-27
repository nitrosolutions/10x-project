// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { VitePWA } from "vite-plugin-pwa";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({}),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "robots.txt"],
        manifest: {
          name: "PortfelIO",
          short_name: "PortfelIO",
          description: "Automatyczne śledzenie wydatków przez skanowanie paragonów",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#0ea5e9",
          lang: "pl",
          icons: [
            {
              src: "/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/apple-touch-icon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
        workbox: {
          // Precache tylko statyczne assety - bez HTML (które się renderują dynamicznie server-side)
          globPatterns: ["**/*.{js,css,svg,png,ico,txt,woff2}"],

          // Wyłączenie fallback navigation - każdy request musi być świeży
          navigateFallback: null,
          navigateFallbackDenylist: [/^\/api\//, /^\/receipts\//],

          runtimeCaching: [
            // Google Fonts - cache first (zewnętrzny zasób, rzadko się zmienia)
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // HTML navigation requests - zawsze świeże, nigdy nie cache'ować
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkOnly",
              options: {
                cacheName: "pages-cache",
              },
            },
            // API endpoints - zawsze świeże, nigdy nie cache'ować
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: "NetworkOnly",
              options: {
                cacheName: "api-cache",
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
  },
});
