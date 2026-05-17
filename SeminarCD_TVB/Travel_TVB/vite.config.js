import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 23841,
    allowedHosts: [
      'srv1488417.hstgr.cloud',
    ]
  }
})
