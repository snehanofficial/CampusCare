import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src/workers",
        filename: "sw.ts",
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          type: "module",
        },
        manifest: {
          name: "CampusCare ITSM Portal",
          short_name: "CampusCare",
          description: "Mobile-First Campus Help Desk & IT Service Management Platform",
          theme_color: "#7c3aed",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      port: env.VITE_PORT ? parseInt(env.VITE_PORT) : 5173,
      host: true
    }
  };
});
