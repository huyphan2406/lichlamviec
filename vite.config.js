import { defineConfig } from 'vite'
// Tên plugin React chính xác
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
})