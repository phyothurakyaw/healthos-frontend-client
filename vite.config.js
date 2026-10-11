import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), tailwindcss()],

    server: {
      port: 3000,

      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:5001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});