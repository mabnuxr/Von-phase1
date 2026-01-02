import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Library build configuration
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: path.resolve(dirname, 'src/index.ts'),
      name: 'VonlabsDesignComponents',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm.js' : 'js'}`,
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled into the library
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@thesysai/genui-sdk',
        '@crayonai/react-ui',
        'framer-motion',
        'rsuite',
        '@phosphor-icons/react',
        'highcharts',
        'highcharts-react-official',
      ],
      output: {
        // Provide global variables for UMD build
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
        // Preserve module structure for better tree-shaking
        preserveModules: false,
      },
    },
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Clear output directory before build
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'rsuite'],
  },
});
