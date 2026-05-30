import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import layoutPlugin from './vite-plugin-layout.js'

function getPages() {
  const pagesDir = path.resolve(process.cwd(), 'pages')
  const base = path.resolve(pagesDir, '..')
  const pages = { index: path.resolve(base, 'index.html') }
  if (fs.existsSync(pagesDir)) {
    for (const file of fs.readdirSync(pagesDir)) {
      if (file.endsWith('.html')) {
        const key = `pages/${file.replace('.html', '')}`
        pages[key] = path.resolve(pagesDir, file)
      }
    }
  }
  return pages
}

export default defineConfig({
  plugins: [layoutPlugin()],
  server: { port: 3000, open: false },
  build: {
    rollupOptions: { input: getPages() },
    assetsInlineLimit: 0
  }
})
