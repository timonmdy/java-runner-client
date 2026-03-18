import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'src/renderer',
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    reportCompressedSize: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src/renderer') } },
  server: { port: 5173 },
})
