import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import layoutPlugin from './vite-plugin-layout.js'

function walkDir(dir, base) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), base))
    } else if (entry.name.endsWith('.html')) {
      const rel = path.relative(base, path.join(dir, entry.name))
      const key = rel.replace('.html', '')
      results.push({ key, abs: path.join(dir, entry.name) })
    }
  }
  return results
}

function getPages() {
  const pagesDir = path.resolve(process.cwd(), 'pages')
  const base = path.resolve(pagesDir, '..')
  const pages = { index: path.resolve(base, 'index.html') }
  // Also include root-level entry points
  const adminEntry = path.resolve(base, '_admin.html')
  if (fs.existsSync(adminEntry)) pages['_admin'] = adminEntry
  for (const { key, abs } of walkDir(pagesDir, base)) {
    pages[key] = abs
  }
  return pages
}

export default defineConfig({
  plugins: [layoutPlugin()],
  server: {
    port: 3034,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:42069', // Ponder serve
        changeOrigin: true,
        // Don't proxy static files like /api.js
        bypass(req) {
          const pathname = req.url?.split('?')[0] || ''
          if (pathname.match(/\.(js|css|html|png|jpg|svg|ico)$/)) return req.url
        },
      },
    },
  },
  build: {
    rollupOptions: { input: getPages() },
    assetsInlineLimit: 0
  }
})
