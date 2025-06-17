// frontend/vite.config.js - ALTERNATIVE VERSION WITH INLINE CSS CONFIG
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Inline CSS configuration to avoid PostCSS config file issues
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 3000,
    host: true
  },
  
  preview: {
    port: 3000,
    host: true
  }
})
