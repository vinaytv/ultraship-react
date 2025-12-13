import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "https://ultraship-backend-4.onrender.com",
        changeOrigin: true
      },
      "/api": {
        target: "https://ultraship-backend-4.onrender.com",
        changeOrigin: true
      }
    }
  }
});
