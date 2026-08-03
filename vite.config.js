import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the "paths" mapping in jsconfig.json so the editor and the
    // bundler agree. Additive: existing relative imports keep working.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    // NOTE: the legacy worktree (Velexp_Admin) also resolves to 5173 — its
    // package.json passes `vite --port 5173`, which overrides its own config's
    // 5174. Change one of them if both dev servers need to run at once.
    port: 5173,
    proxy: {
      '/media': {
        target: 'https://velexp.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
