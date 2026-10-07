import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { obrastockApiPlugin } from './server/apiMiddleware.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    obrastockApiPlugin()
  ],
  server: {
    host: true,
    port: 5173,
  }
})
