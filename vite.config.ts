import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Usiamo process.cwd() per trovare la cartella corrente in modo sicuro
const root = process.cwd();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(root, "client", "src"),
      "@shared": path.resolve(root, "shared"),
    },
  },
  root: "client",
  build: {
    outDir: path.resolve(root, "dist/public"),
    emptyOutDir: true,
  },
});