import { createMiddleware } from 'hono/factory'
import { AUD_ADMIN, AUD_COMMUNITY, verifyToken } from '../lib/jwt.js'

/** Prefer community token; fall back to admin for liked-state in admin tools */
export const optionalAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token) {
    try {
      const community = await verifyToken(token, { audience: AUD_COMMUNITY })
      c.set('user', community)
      c.set('member', community)
    } catch {
      try {
        const admin = await verifyToken(token, { audience: AUD_ADMIN })
        c.set('user', admin)
      } catch {
        /* ignore */
      }
    }
  }
  await next()
})
