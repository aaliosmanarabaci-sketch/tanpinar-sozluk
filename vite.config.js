import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Minification - esbuild daha hızlı ve güvenilir
    minify: 'esbuild',
    // Source maps kapalı (production)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Basit code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Chunk size uyarıları
    chunkSizeWarningLimit: 1000,
    // Out directory
    outDir: 'dist',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
  // Public directory
  publicDir: 'public',
})
