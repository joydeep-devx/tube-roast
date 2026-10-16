import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to Express so the browser sees a single origin: no CORS, simpler cookies.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
