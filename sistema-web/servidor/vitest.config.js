import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['pruebas/**/*.test.js'],
    env: {
      JWT_SECRETO: 'secreto-de-prueba',
      JWT_EXPIRACION: '1h',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
    },
  },
})