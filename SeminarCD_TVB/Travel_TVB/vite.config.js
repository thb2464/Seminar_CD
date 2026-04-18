import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'srv1488417.hstgr.cloud',
      '01bc7c37a2f6.ngrok-free.app',
      '484d62a26b29.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io',
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: 23841,
    allowedHosts: [
      'srv1488417.hstgr.cloud',
    ]
  }
})
