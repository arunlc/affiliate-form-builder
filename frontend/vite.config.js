import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    
    rollupOptions: {
      output: {
        // Ensure consistent naming for Django static file collection
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        },
        
        // Optimize chunking
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'utils': ['axios', 'clsx', 'date-fns']
        }
      }
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Ensure all assets are properly hashed for caching
    assetsInlineLimit: 4096
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    
    // Proxy API requests to Django in development
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/embed': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    } : undefined
  },
  
  // Preview server (for testing production build)
  preview: {
    port: 3000,
    host: true,
    strictPort: true
  },
  
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    '__DEV__': mode === 'development'
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-query',
      'lucide-react'
    ]
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  },
  
  // Production-specific optimizations
  ...(mode === 'production' && {
    esbuild: {
      drop: ['console', 'debugger']
    }
  })
}))
