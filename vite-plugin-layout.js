import fs from 'fs'
import path from 'path'

/**
 * Vite plugin that wraps page HTML with a shared shell layout.
 * Pages opt-in by including a layout directive at the top:
 *   <!-- layout: app-shell -->   → admin shell (sidebar + header)
 *   <!-- layout: site-shell -->  → site shell (bottom nav + mobile header)
 */
export default function layoutPlugin() {
  const baseDir = process.cwd()
  let adminShell = ''
  let siteShell = ''

  return {
    name: 'vite-plugin-layout',
    buildStart() {
      const adminPath = path.resolve(baseDir, 'components/layout/app-shell.html')
      const sitePath = path.resolve(baseDir, 'components/layout/site-shell.html')
      if (fs.existsSync(adminPath)) adminShell = fs.readFileSync(adminPath, 'utf-8')
      if (fs.existsSync(sitePath)) siteShell = fs.readFileSync(sitePath, 'utf-8')
    },
    transformIndexHtml(html, ctx) {
      // Always re-read shell in dev mode so HMR works for layout changes
      if (process.env.NODE_ENV !== 'production') {
        const adminPath = path.resolve(baseDir, 'components/layout/app-shell.html')
        const sitePath = path.resolve(baseDir, 'components/layout/site-shell.html')
        if (fs.existsSync(adminPath)) adminShell = fs.readFileSync(adminPath, 'utf-8')
        if (fs.existsSync(sitePath)) siteShell = fs.readFileSync(sitePath, 'utf-8')
      }
      const trimmed = html.trimStart()
      let shellHtml

      if (trimmed.startsWith('<!-- layout: app-shell -->')) {
        shellHtml = adminShell
      } else if (trimmed.startsWith('<!-- layout: site-shell -->')) {
        shellHtml = siteShell
      } else {
        return html
      }

      if (!shellHtml) {
        console.warn('[layout] shell template not found, skipping')
        return html
      }

      // Extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/)
      const pageTitle = titleMatch ? titleMatch[1] : ''

      // Extract extra head content (remove common elements already in shell)
      const headMatch = html.match(/<head>([\s\S]*?)<\/head>/)
      let extraHead = ''
      if (headMatch) {
        extraHead = headMatch[1]
          .replace(/<meta\s+charset="UTF-8">\s*/gi, '')
          .replace(/<meta\s+name="viewport"\s+content="[^"]*">\s*/gi, '')
          .replace(/<link\s+rel="stylesheet"\s+href="\/style\.css">\s*/gi, '')
          .replace(/<link\s+rel="icon"\s+href="[^"]*">\s*/gi, '')
          .replace(/<title>[^<]*<\/title>\s*/gi, '')
          .trim()
      }

      // Extract body content
      const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/)
      const bodyContent = bodyMatch ? bodyMatch[1].trim() : ''

      // Build result
      let result = shellHtml
        .replace('__PAGE_TITLE__', pageTitle)
        .replace('<!-- __EXTRA_HEAD__ -->', extraHead || '')
        .replace('__PAGE_CONTENT__', bodyContent)

      return result
    }
  }
}
