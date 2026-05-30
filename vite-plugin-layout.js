import fs from 'fs'
import path from 'path'

/**
 * Vite plugin that wraps page HTML with a shared app shell layout.
 * Pages opt-in by including `<!-- layout: app-shell -->` at the top.
 *
 * The page file should be a valid HTML document containing:
 *   - <head> with <title> and optional extra tags
 *   - <body> with the page-specific content (typically <div id="page-content">...)
 *
 * The plugin extracts the title, extra head content, and body content,
 * then injects them into components/layout/app-shell.html.
 */
export default function layoutPlugin() {
  const shellPath = path.resolve(process.cwd(), 'components/layout/app-shell.html')
  let shellHtml = ''

  return {
    name: 'vite-plugin-layout',
    buildStart() {
      if (fs.existsSync(shellPath)) {
        shellHtml = fs.readFileSync(shellPath, 'utf-8')
      }
    },
    transformIndexHtml(html, ctx) {
      // Only process pages that opt-in
      if (!html.trimStart().startsWith('<!-- layout: app-shell -->')) {
        return html
      }

      if (!shellHtml) {
        console.warn('[layout] app-shell.html not found, skipping layout injection')
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
