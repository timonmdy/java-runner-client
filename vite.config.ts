import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
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
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
        },
      },
    },
    reportCompressedSize: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/main/shared'),
    },
  },
  server: { port: 5173 },
});
