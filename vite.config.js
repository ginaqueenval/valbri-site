import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//连接地址配置
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        // 后面替换域名地址
        // 是否允许跨域
        changeOrigin: true,
      },
    },
  },
});
