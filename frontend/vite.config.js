import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    // Stuurt alle /api-aanroepen automatisch door naar de backend
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
