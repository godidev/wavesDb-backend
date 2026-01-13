import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@models': path.resolve(__dirname, './src/models'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@myTypes': path.resolve(__dirname, './src/types'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@data': path.resolve(__dirname, './src/data'),
      '@logger': path.resolve(__dirname, './src/logger'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
