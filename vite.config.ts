/// <reference types="vite/client" />

import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import dts from 'vite-plugin-dts';

export default defineConfig(() => {
  return {
    build: {
      cssCodeSplit: false,
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
      cssInjectedByJsPlugin(),
      dts({
        copyDtsFiles: true, // Add this
        exclude: ['**/*.test.ts', '**/*.stories.ts'], // Exclude test files
        include: ['src/lib/**/*'],
        insertTypesEntry: true,
        outDir: 'dist',
        rollupTypes: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
