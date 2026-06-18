import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wooCommerceProxy } from './vite-wc-proxy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wooCommerceProxy() // Dynamic WooCommerce proxy
  ],
  build: {
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react'],
          // Page chunks
          'pages': ['./src/pages/Admin.tsx', './src/pages/Profile.tsx', './src/pages/Login.tsx', './src/pages/Register.tsx'],
        }
      }
    },
    // Increase chunk warning limit
    chunkSizeWarningLimit: 600
  },
  server: {
    proxy: {
      // Proxy Salla OAuth token endpoint to bypass CORS
      '/api/salla/token': {
        target: 'https://accounts.salla.sa',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/salla\/token/, '/oauth2/token'),
        secure: true
      },
      // Proxy Salla API calls
      '/api/salla/v2': {
        target: 'https://api.salla.dev/admin',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/salla\/v2/, '/v2'),
        secure: true
      }
    }
  }
})

