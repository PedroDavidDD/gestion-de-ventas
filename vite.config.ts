import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Opcional: agrega alias personalizados aquí
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: ['node_modules']
  },
  optimizeDeps: {
    include: ['lucide-react'],
    esbuildOptions: {
      // Forzar a esbuild a tratar ciertos módulos como CJS
      external: ['lucide-react/dist/esm/icons/*'],
    }
  }
});