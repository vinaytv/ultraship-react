import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/graphql": {
        target: process.env.VITE_DEV_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true
      },
      "/api": {
        target: process.env.VITE_DEV_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
