import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const minifyTranslations = () => {
  return {
    name: 'minify-translations',
    closeBundle: () => {
      const dir = path.resolve(__dirname, 'dist/translations');

      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        let count = 0;
        let total = 0;
        let minified = 0;

        files.forEach((file) => {
          if (file.endsWith('.json')) {
            const filePath = path.join(dir, file);
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              total += content.length;

              const minifiedContent = JSON.stringify(JSON.parse(content));
              minified += minifiedContent.length;
              fs.writeFileSync(filePath, minifiedContent);
              count++;
            } catch (error) {
              console.error(`[minify-translations] Error processing ${file}:`, error);
            }
          }
        });

        console.log(`[minify-translations] Minified ${count} JSON files in dist/translations`);
        console.log(`[minify-translations] Total size before minification: ${total} bytes`);
        console.log(`[minify-translations] Total size after minification: ${minified} bytes`);
      }
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss(), minifyTranslations()],
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
          if (id.includes('zod/v4/locales')) {
            return 'zod-locale';
          }
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
