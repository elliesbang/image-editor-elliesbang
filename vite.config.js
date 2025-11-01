import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Cloudflare Pages용 상대 경로 설정
export default defineConfig({
  plugins: [react()],
  base: "./", // ⚠️ 이 한 줄이 핵심!
});
