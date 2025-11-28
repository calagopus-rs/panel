import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1024,
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        experimentalMinChunkSize: 102400,
        manualChunks(id) {
          if (
            id.includes('src/providers/') ||
            id.includes('src/plugins/') ||
            id.includes('src/stores/') ||
            id.includes('src/lib/')
          ) {
            return 'shared';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
      '/avatars': 'http://localhost:8000',
    },
    allowedHosts: true,
  },
});
