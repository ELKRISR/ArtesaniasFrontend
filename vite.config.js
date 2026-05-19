import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Artesanías Katerine - Tienda Online",
        short_name: "Artesanías",
        description: "Tienda online de artesanías colombianas",
        theme_color: "#8b4513",
        background_color: "#f8f4f0",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "vite.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],

  // Configuración para desarrollo local (no afecta a Vercel)
  server: {
    // allowedHosts: ["1da7-8-242-189-4.ngrok-free.app"], // Permitir el host de ngrok para desarrollo
    host: "localhost",
    port: 5173,
    fs: {
      strict: true,
      deny: [
        ".env",
        ".env.*",
        ".env.local",
        "*.pem",
        "*.crt",
        "*.key",
        "*.db",
        "*.sqlite",
      ],
    },
  },

  build: {
    sourcemap: false,
    minify: "esbuild",
    emptyOutDir: true,
    // Configuración específica para Vercel
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
