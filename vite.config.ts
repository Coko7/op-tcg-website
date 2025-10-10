import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'three-react': ['@react-three/fiber', '@react-three/drei']
        }
      }
    },
    commonjsOptions: {
      include: [/three/, /node_modules/],
      transformMixedEsModules: true
    }
  },
  resolve: {
    dedupe: ['three']
  }
})