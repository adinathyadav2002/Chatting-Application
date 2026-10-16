import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/user": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/messages": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err: any) => {
            if (
              err?.message?.includes("ECONNRESET") ||
              err?.message?.includes("ended by the other party")
            ) {
              return;
            }
            console.error("Socket proxy error:", err);
          });
        },
      },
    },
  },
});

