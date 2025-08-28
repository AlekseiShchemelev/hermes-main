import { defineConfig } from 'vite'

export default defineConfig({
  // Базовые настройки без proxy
  server: {
    // Без proxy - nginx будет обрабатывать /api
  }
})