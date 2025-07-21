import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    nodePolyfills(),
  ],
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'solana-wallets': [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
          ],
          '@solana-web3': ['@solana/web3.js'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Environment variable prefix
  envPrefix: ['VITE_', 'REACT_APP_'],
})