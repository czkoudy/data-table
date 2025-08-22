/// <reference types="vite/client" />

import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => {
  return {
    build: {
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, './src/lib/index.ts'),
        fileName: (format) => `index.${format}.js`,
        name: 'DataTable',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
      sourcemap: true,
    },
    plugins: [
      react(),
      dts({
        include: ['src/lib/**/*'],
        insertTypesEntry: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
