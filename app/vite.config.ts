import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Look for .env files in workspace root, not app directory
  envDir: path.resolve(__dirname, '..'),
  server: {
    port: 5173,      // always start on 5173
    strictPort: true // fail if it's already in use
  },
  preview: {
    allowedHosts: ['app.vonlabs.ai']
  }
})