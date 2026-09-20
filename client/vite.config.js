import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // Gzip Compression (.gz)
    compression({
      algorithm: 'gzip',
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
    // Brotli Compression (.br)
    compression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      deleteOriginalAssets: false,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux-persist')) {
              return 'vendor-redux';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  },
  server: {
    allowedHosts: ['local.battlefiesta.in', 'demo.goodfeelsd.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:5008',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.warn(`[proxy error] ${req.url?.split('?')[0]}: Backend server (5008) is unreachable (${err.code || 'ECONNREFUSED'})`);
          });
        }
      },
      '/events': {
        target: 'http://localhost:5008',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.warn(`[proxy error] /events: Backend server (5008) is offline (${err.code || 'ECONNREFUSED'})`);
          });
        }
      }
    }
  }
})
