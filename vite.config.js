import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // THÊM CẤU HÌNH BUILD NÀY
  build: {
    rollupOptions: {
      // Đảm bảo Rollup biết cách tìm và sử dụng thư viện react-icons
      external: [/^react-icons/],
    },
  },
  
  // Thêm base URL nếu bạn deploy ở môi trường khác Vercel,
  // nhưng Vercel thường không cần base.
  // base: '/', 
});