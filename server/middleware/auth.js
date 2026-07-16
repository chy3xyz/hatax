import { createMiddleware } from 'hono/factory'
import { AUD_ADMIN, AUD_COMMUNITY, verifyToken } from '../lib/jwt.js'
import { config } from '../config.js'

const ADMIN_ROLES = new Set(['admin', 'operator'])

function unauthorized(c, msg = 'Unauthorized') {
  const accept = c.req.header('Accept') || ''
  if (accept.includes('text/html') || c.req.header('HX-Request')) {
    return c.html(
      `<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">${msg}</td></tr>`,
      401,
    )
  }
  return c.json({ code: 401, msg }, 401)
}

function forbidden(c, msg = 'Forbidden') {
  return c.json({ code: 403, msg }, 403)
}

function bearer(c) {
  const header = c.req.header('Authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/** Admin staff JWT (aud=admin). Used by /admin and content management APIs. */
export const requireAuth = createMiddleware(async (c, next) => {
  const token = bearer(c)
  if (!token) return unauthorized(c)
  try {
    const payload = await verifyToken(token, { audience: AUD_ADMIN })
    if (!ADMIN_ROLES.has(String(payload.role || ''))) {
      return forbidden(c, '需要管理员权限')
    }
    c.set('user', payload)
    await next()
  } catch {
    return unauthorized(c)
  }
})

/** Community member JWT (aud=community). Used for forum post/reply/like. */
export const requireCommunityAuth = createMiddleware(async (c, next) => {
  const token = bearer(c)
  if (!token) return unauthorized(c, '请先登录社区账号')
  try {
    const payload = await verifyToken(token, { audience: AUD_COMMUNITY })
    c.set('user', payload)
    c.set('member', payload)
    await next()
  } catch {
    return unauthorized(c, '请先登录社区账号')
  }
})

/** CSRF: mutating requests must send X-CSRF-Token matching cookie */
export const requireCsrf = createMiddleware(async (c, next) => {
  const method = c.req.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next()
  }
  const headerToken = c.req.header(config.csrfHeader) || c.req.header('X-CSRF-Token')
  const cookieToken = getCookie(c, 'hatax_csrf')
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return c.json({ code: 403, msg: 'Invalid CSRF token' }, 403)
  }
  await next()
})

function getCookie(c, name) {
  const raw = c.req.header('Cookie') || ''
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export function setCsrfCookie(c, token) {
  const secure = config.isProd ? '; Secure' : ''
  // Lax: works across Vite:port → API:port on localhost while still blocking classic CSRF
  c.header(
    'Set-Cookie',
    `hatax_csrf=${encodeURIComponent(token)}; Path=/; SameSite=Lax; HttpOnly${secure}`,
    { append: true },
  )
}

export { ADMIN_ROLES }
