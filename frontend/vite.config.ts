import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
        '^/(auth|workgroups|projects|tasks|roles)': 'http://localhost:8080',
    },
  },
})