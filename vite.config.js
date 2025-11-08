import { defineConfig } from 'vite'
// ⚠️ Dòng này đã được sửa lỗi cú pháp
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Đảm bảo bạn đã chạy 'npm install @vitejs/plugin-react'
  plugins: [react()], 
})