import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ 꼭 넣어야 Cloudflare Pages에서 상대경로 인식
});
