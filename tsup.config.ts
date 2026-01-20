import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['api/index.ts', 'api/cron.ts'],
  outDir: 'api-build',
  format: ['cjs'],
  target: 'node20',
  clean: true,
  sourcemap: false,
  splitting: false,
  // Bundle all dependencies to resolve path aliases
  noExternal: [/.*/],
  esbuildOptions(options) {
    options.alias = {
      '@controllers': './src/controllers',
      '@models': './src/models',
      '@routes': './src/routes',
      '@utils': './src/utils',
      '@myTypes': './src/types',
      '@middleware': './src/middleware',
      '@data': './src/data',
      '@logger': './src/logger',
      '@config': './src/config',
      '@services': './src/services',
      '@schemas': './src/schemas',
    }
  },
})
