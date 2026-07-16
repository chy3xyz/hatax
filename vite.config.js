import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import layoutPlugin from './vite-plugin-layout.js'

function collectHtml(dir, prefix, out) {
  if (!fs.existsSync(dir)) return
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.html')) continue
    const key = `${prefix}/${file.replace('.html', '')}`
    out[key] = path.resolve(dir, file)
  }
}

function getPages() {
  const root = process.cwd()
  const pages = { index: path.resolve(root, 'index.html') }
  collectHtml(path.resolve(root, 'admin'), 'admin', pages)
  collectHtml(path.resolve(root, 'pages'), 'pages', pages)
  return pages
}

// Empty string = same-origin (use Vite /api proxy). Unset defaults to direct API URL.
const apiBase =
  process.env.VITE_API_BASE !== undefined
    ? process.env.VITE_API_BASE
    : 'http://localhost:8790'

export default defineConfig({
  plugins: [layoutPlugin()],
  server: {
    port: Number(process.env.VITE_PORT || 3485),
    open: false,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:8790',
        changeOrigin: true,
      },
    },
  },
  // Dev: browser hits API directly so /api is never proxied to unrelated :8787 apps
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase),
  },
  build: {
    rollupOptions: { input: getPages() },
    assetsInlineLimit: 0,
  },
})
