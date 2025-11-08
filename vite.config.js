import { defineConfig } from 'vite'
// 1. Import plugin React (tên chính xác)
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Kích hoạt plugin React
  ],
})