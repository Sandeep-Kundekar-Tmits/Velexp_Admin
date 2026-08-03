// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///D:/Velexp-admin/New_ui/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Velexp-admin/New_ui/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/Velexp-admin/New_ui/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///D:/Velexp-admin/New_ui/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the "paths" mapping in jsconfig.json so the editor and the
    // bundler agree. Additive: existing relative imports keep working.
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    host: "0.0.0.0",
    // NOTE: the legacy worktree (Velexp_Admin) also resolves to 5173 — its
    // package.json passes `vite --port 5173`, which overrides its own config's
    // 5174. Change one of them if both dev servers need to run at once.
    port: 5173,
    proxy: {
      "/media": {
        target: "https://velexp.com",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxWZWxleHAtYWRtaW5cXFxcTmV3X3VpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxWZWxleHAtYWRtaW5cXFxcTmV3X3VpXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9WZWxleHAtYWRtaW4vTmV3X3VpL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSBcIm5vZGU6dXJsXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgLy8gTWlycm9ycyB0aGUgXCJwYXRoc1wiIG1hcHBpbmcgaW4ganNjb25maWcuanNvbiBzbyB0aGUgZWRpdG9yIGFuZCB0aGVcclxuICAgIC8vIGJ1bmRsZXIgYWdyZWUuIEFkZGl0aXZlOiBleGlzdGluZyByZWxhdGl2ZSBpbXBvcnRzIGtlZXAgd29ya2luZy5cclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuL3NyY1wiLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIC8vIE5PVEU6IHRoZSBsZWdhY3kgd29ya3RyZWUgKFZlbGV4cF9BZG1pbikgYWxzbyByZXNvbHZlcyB0byA1MTczIFx1MjAxNCBpdHNcclxuICAgIC8vIHBhY2thZ2UuanNvbiBwYXNzZXMgYHZpdGUgLS1wb3J0IDUxNzNgLCB3aGljaCBvdmVycmlkZXMgaXRzIG93biBjb25maWcnc1xyXG4gICAgLy8gNTE3NC4gQ2hhbmdlIG9uZSBvZiB0aGVtIGlmIGJvdGggZGV2IHNlcnZlcnMgbmVlZCB0byBydW4gYXQgb25jZS5cclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL21lZGlhJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vdmVsZXhwLmNvbScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBQLFNBQVMsZUFBZSxXQUFXO0FBQzdSLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUhpSSxJQUFNLDJDQUEyQztBQUsxTSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFNBQVM7QUFBQTtBQUFBO0FBQUEsSUFHUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSU4sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsVUFBVTtBQUFBLFFBQ1IsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
