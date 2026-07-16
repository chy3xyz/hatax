import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { AUD_ADMIN, signToken } from '../lib/jwt.js'
import { findUserByUsername, publicUser } from '../db/users.js'
import { addLoginLog } from '../db/logs.js'
import { ADMIN_ROLES, setCsrfCookie } from '../middleware/auth.js'

export const authRoutes = new Hono()

authRoutes.get('/csrf', (c) => {
  const token = randomUUID()
  setCsrfCookie(c, token)
  return c.json({ code: 0, data: { csrfToken: token } })
})

/** Staff login for /admin only — community members must use /api/community/login */
authRoutes.post('/login', async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || ''
  const ua = c.req.header('user-agent') || ''
  const browser = ua.slice(0, 80)

  if (!username || !password) {
    return c.json({ code: 400, msg: '用户名和密码不能为空' }, 400)
  }

  const user = findUserByUsername(username)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    addLoginLog({
      username: username || 'unknown',
      ip,
      location: '',
      browser,
      status: 'fail',
      message: '用户名或密码错误',
    })
    return c.json({ code: 401, msg: '用户名或密码错误' }, 401)
  }
  if (user.status === 'disabled') {
    addLoginLog({
      username,
      ip,
      browser,
      status: 'fail',
      message: '账号已禁用',
    })
    return c.json({ code: 403, msg: '账号已禁用' }, 403)
  }
  if (!ADMIN_ROLES.has(String(user.role || ''))) {
    addLoginLog({
      username,
      ip,
      browser,
      status: 'fail',
      message: '非管理员账号',
    })
    return c.json({ code: 403, msg: '此账号无法登录管理后台，请使用社区登录' }, 403)
  }

  const token = await signToken(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    },
    { audience: AUD_ADMIN },
  )
  const csrfToken = randomUUID()
  setCsrfCookie(c, csrfToken)

  addLoginLog({
    username: user.username,
    ip,
    location: '',
    browser,
    status: 'success',
  })

  return c.json({
    code: 0,
    msg: 'ok',
    data: {
      token,
      csrfToken,
      user: publicUser(user),
    },
  })
})

authRoutes.post('/logout', (c) => {
  c.header('Set-Cookie', 'hatax_csrf=; Path=/; Max-Age=0', { append: true })
  return c.json({ code: 0, msg: 'ok' })
})
