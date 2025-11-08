import { defineConfig } from 'vite'
// ⚠️ Tên đúng phải là @vitejs/plugin-react (dùng gạch chéo '/')
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})