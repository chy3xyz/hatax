import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { AUD_COMMUNITY, signToken } from '../lib/jwt.js'
import {
  findMemberByUsername,
  publicMember,
  registerMember,
  findMemberById,
  updateMemberProfile,
  changeMemberPassword,
  listPointLogs,
  listMembers,
  updateMemberStatus,
  adjustMemberPoints,
  memberActivityStats,
  POINT_RULES,
} from '../db/members.js'
import {
  publicProfile,
  resolveMember,
  followMember,
  unfollowMember,
  listFollowing,
  listFollowers,
  followCounts,
  listConversations,
  listMessages,
  sendMessage,
  unreadMessageCount,
} from '../db/social.js'
import { requireAuth, requireCommunityAuth, requireCsrf, setCsrfCookie } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optional-auth.js'
import { addOpLog } from '../db/logs.js'

export const communityRoutes = new Hono()

function memberTokenPayload(member) {
  return {
    sub: String(member.id),
    username: member.username,
    displayName: member.displayName,
  }
}

function profilePayload(member) {
  const stats = memberActivityStats(member.id)
  const counts = followCounts(member.id)
  return {
    ...publicMember(member),
    stats,
    followingCount: counts.following,
    followerCount: counts.followers,
    unreadMessages: unreadMessageCount(member.id),
    pointRules: Object.fromEntries(
      Object.entries(POINT_RULES).map(([k, v]) => [k, { delta: v.delta, reason: v.reason }]),
    ),
  }
}

communityRoutes.post('/register', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const member = registerMember(body)
    const token = await signToken(memberTokenPayload(member), { audience: AUD_COMMUNITY })
    const csrfToken = randomUUID()
    setCsrfCookie(c, csrfToken)
    return c.json(
      {
        code: 0,
        msg: '注册成功',
        data: { token, csrfToken, user: publicMember(member) },
      },
      201,
    )
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.post('/login', async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  if (!username || !password) {
    return c.json({ code: 400, msg: '用户名和密码不能为空' }, 400)
  }

  const member = findMemberByUsername(username)
  if (!member || !(await bcrypt.compare(password, member.passwordHash))) {
    return c.json({ code: 401, msg: '用户名或密码错误' }, 401)
  }
  if (member.status === 'disabled') {
    return c.json({ code: 403, msg: '账号已禁用' }, 403)
  }

  const token = await signToken(memberTokenPayload(member), { audience: AUD_COMMUNITY })
  const csrfToken = randomUUID()
  setCsrfCookie(c, csrfToken)

  return c.json({
    code: 0,
    msg: 'ok',
    data: {
      token,
      csrfToken,
      user: publicMember(member),
    },
  })
})

communityRoutes.get('/me', requireCommunityAuth, (c) => {
  const payload = c.get('member') || c.get('user')
  const member = findMemberById(Number(payload.sub))
  if (!member) return c.json({ code: 401, msg: '账号不存在' }, 401)
  return c.json({ code: 0, data: profilePayload(member) })
})

communityRoutes.put('/me', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const payload = c.get('member') || c.get('user')
  try {
    const member = updateMemberProfile(Number(payload.sub), body)
    if (!member) return c.json({ code: 404, msg: '账号不存在' }, 404)
    return c.json({ code: 0, msg: '已保存', data: profilePayload(member) })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.post('/me/password', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const payload = c.get('member') || c.get('user')
  try {
    changeMemberPassword(Number(payload.sub), body)
    return c.json({ code: 0, msg: '密码已更新' })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.get('/me/points', requireCommunityAuth, (c) => {
  const payload = c.get('member') || c.get('user')
  const member = findMemberById(Number(payload.sub))
  if (!member) return c.json({ code: 401, msg: '账号不存在' }, 401)
  const logs = listPointLogs(member.id, { limit: Number(c.req.query('limit') || 40) })
  return c.json({
    code: 0,
    data: {
      points: member.points,
      logs,
      rules: Object.fromEntries(
        Object.entries(POINT_RULES).map(([k, v]) => [k, { delta: v.delta, reason: v.reason }]),
      ),
    },
  })
})

communityRoutes.get('/me/following', requireCommunityAuth, (c) => {
  const id = Number((c.get('member') || c.get('user')).sub)
  return c.json({ code: 0, data: listFollowing(id) })
})

communityRoutes.get('/me/followers', requireCommunityAuth, (c) => {
  const id = Number((c.get('member') || c.get('user')).sub)
  return c.json({ code: 0, data: listFollowers(id) })
})

communityRoutes.get('/members/:key', optionalAuth, (c) => {
  const member = resolveMember(c.req.param('key'))
  if (!member) return c.json({ code: 404, msg: '用户不存在' }, 404)
  const viewer = c.get('member') || c.get('user')
  const viewerId = viewer?.sub != null ? Number(viewer.sub) : null
  const data = publicProfile(member.id, viewerId)
  return c.json({ code: 0, data })
})

communityRoutes.get('/members/:key/following', (c) => {
  const member = resolveMember(c.req.param('key'))
  if (!member) return c.json({ code: 404, msg: '用户不存在' }, 404)
  return c.json({ code: 0, data: listFollowing(member.id, { limit: 50 }) })
})

communityRoutes.get('/members/:key/followers', (c) => {
  const member = resolveMember(c.req.param('key'))
  if (!member) return c.json({ code: 404, msg: '用户不存在' }, 404)
  return c.json({ code: 0, data: listFollowers(member.id, { limit: 50 }) })
})

communityRoutes.post('/members/:id/follow', requireCommunityAuth, requireCsrf, (c) => {
  const me = Number((c.get('member') || c.get('user')).sub)
  try {
    const result = followMember(me, Number(c.req.param('id')))
    return c.json({ code: 0, msg: '已关注', data: result })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.delete('/members/:id/follow', requireCommunityAuth, requireCsrf, (c) => {
  const me = Number((c.get('member') || c.get('user')).sub)
  const result = unfollowMember(me, Number(c.req.param('id')))
  return c.json({ code: 0, msg: '已取消关注', data: result })
})

communityRoutes.get('/dm/conversations', requireCommunityAuth, (c) => {
  const me = Number((c.get('member') || c.get('user')).sub)
  return c.json({ code: 0, data: listConversations(me) })
})

communityRoutes.get('/dm/conversations/:id', requireCommunityAuth, (c) => {
  const me = Number((c.get('member') || c.get('user')).sub)
  const data = listMessages(c.req.param('id'), me)
  if (!data) return c.json({ code: 404, msg: '会话不存在' }, 404)
  return c.json({ code: 0, data })
})

communityRoutes.post('/dm/messages', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const me = Number((c.get('member') || c.get('user')).sub)
  try {
    const msg = sendMessage(me, {
      toMemberId: body.toMemberId,
      conversationId: body.conversationId,
      body: body.body,
    })
    return c.json({ code: 0, msg: '已发送', data: msg }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.get('/dm/unread', requireCommunityAuth, (c) => {
  const me = Number((c.get('member') || c.get('user')).sub)
  return c.json({ code: 0, data: { count: unreadMessageCount(me) } })
})

communityRoutes.post('/logout', (c) => {
  return c.json({ code: 0, msg: 'ok' })
})

/** Admin: community member management */
communityRoutes.get('/admin/members', requireAuth, (c) => {
  const q = c.req.query()
  const result = listMembers({
    q: q.q || '',
    status: q.status || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 20),
  })
  const rows = result.rows.map((m) => ({
    ...m,
    stats: memberActivityStats(m.id),
  }))
  return c.json({ code: 0, data: { ...result, rows } })
})

communityRoutes.put('/admin/members/:id/status', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const member = updateMemberStatus(c.req.param('id'), body.status)
    if (!member) return c.json({ code: 404, msg: '会员不存在' }, 404)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '社区',
      action: body.status === 'disabled' ? '禁用会员' : '启用会员',
      detail: `@${member.username}`,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '已更新', data: member })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.post('/admin/members/:id/points', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const member = adjustMemberPoints(c.req.param('id'), body.delta, body.reason)
    if (!member) return c.json({ code: 404, msg: '会员不存在' }, 404)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '社区',
      action: '调整积分',
      detail: `@${member.username} ${body.delta > 0 ? '+' : ''}${body.delta}`,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '积分已调整', data: member })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

communityRoutes.get('/admin/members/:id/points', requireAuth, (c) => {
  const member = findMemberById(c.req.param('id'))
  if (!member) return c.json({ code: 404, msg: '会员不存在' }, 404)
  return c.json({
    code: 0,
    data: {
      points: member.points,
      logs: listPointLogs(member.id, { limit: Number(c.req.query('limit') || 30) }),
    },
  })
})
