import { defineConfig } from 'vite'
import react from '@vitejs-plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // KHÔNG thêm bất cứ thứ gì khác, đặc biệt là không thêm "base".
  // Đây là cấu hình chuẩn và ĐÚNG cho Vercel.
})