import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you deploy to GitHub Pages under a repo subpath, set base: '/<repo>/'.
export default defineConfig({
  plugins: [react()],
  // base: '/loh2-site/',
})
