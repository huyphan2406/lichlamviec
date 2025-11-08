import { defineConfig } from 'vite'
// 1. Import plugin React (tên chính xác)
import react from '@vitejs/plugin-react'
// 2. Import plugin hỗ trợ Node Module (Fix lỗi "react-icons")
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Kích hoạt plugin React
    // Kích hoạt plugin Polyfills để fix lỗi tải icon
    nodePolyfills(), 
  ],
})