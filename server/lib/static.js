import { join, normalize, sep } from 'node:path'

/**
 * Serve files from an absolute dist directory (works for source + bun --compile --asset).
 */
export function serveDist(distDir) {
  const root = normalize(distDir + sep)

  return async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return next()
    if (c.req.path.startsWith('/api/')) return next()

    let rel = decodeURIComponent(c.req.path)
    if (rel === '/' || rel === '') rel = '/index.html'
    if (rel.endsWith('/')) rel = `${rel}index.html`

    const full = normalize(join(distDir, rel))
    if (!full.startsWith(root) && full !== normalize(distDir)) {
      return c.text('Forbidden', 403)
    }

    let file = Bun.file(full)
    if (!(await file.exists())) {
      // MPA: try .html for extensionless paths
      if (!rel.includes('.')) {
        const htmlPath = normalize(join(distDir, `${rel}.html`))
        if (htmlPath.startsWith(root)) {
          file = Bun.file(htmlPath)
        }
      }
    }

    if (!(await file.exists())) return next()
    return new Response(file)
  }
}
