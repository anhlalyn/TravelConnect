import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-router-dom')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps'
          if (id.includes('socket.io-client')) return 'socket'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('axios')) return 'http'

          return 'vendor'
        },
      },
    },
  },
})
