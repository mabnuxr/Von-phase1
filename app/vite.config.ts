import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname, '..'),
    server: {
      port: 5173,      // always start on 5173
      strictPort: true, // fail if it's already in use
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:4173',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
          },
        }
      }
    },
    preview: {
      allowedHosts: ['app.vonlabs.ai']
    },
    optimizeDeps: {
      include: [
        '@thesysai/genui-sdk',
        '@crayonai/react-ui',
      ]
    }
  }
})