import { Hono } from 'hono'
import {
  EVENT_CATEGORIES,
  EVENT_MODES,
  listEvents,
  listMySignups,
  findEventById,
  findEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  signupEvent,
  cancelSignup,
  listEventSignups,
  eventStats,
  adminCancelSignup,
} from '../db/events.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCommunityAuth, requireCsrf } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optional-auth.js'

export const eventRoutes = new Hono()

const CATEGORY_LABELS = {
  conference: '产业大会',
  healing: '疗愈活动',
  online: '线上大会',
  meetup: '线下沙龙',
  other: '其他活动',
}
const MODE_LABELS = { offline: '线下', online: '线上', hybrid: '线上+线下' }

eventRoutes.get('/meta', (c) =>
  c.json({
    code: 0,
    data: {
      categories: EVENT_CATEGORIES.map((k) => ({ key: k, label: CATEGORY_LABELS[k] || k })),
      modes: EVENT_MODES.map((k) => ({ key: k, label: MODE_LABELS[k] || k })),
    },
  }),
)

eventRoutes.get('/stats', requireAuth, (c) => c.json({ code: 0, data: eventStats() }))

eventRoutes.get('/mine', requireCommunityAuth, (c) => {
  const memberId = Number(c.get('member').sub)
  return c.json({ code: 0, data: listMySignups(memberId) })
})

eventRoutes.get('/admin', requireAuth, (c) => {
  const q = c.req.query()
  const rows = listEvents({
    category: q.category || '',
    q: q.q || '',
    status: q.status || '',
    includeDrafts: true,
  })
  return c.json({ code: 0, data: rows })
})

eventRoutes.get('/admin/:id', requireAuth, (c) => {
  const event = findEventById(c.req.param('id'), { admin: true })
  if (!event) return c.json({ code: 404, msg: '活动不存在' }, 404)
  return c.json({ code: 0, data: event })
})

eventRoutes.get('/admin/:id/signups', requireAuth, (c) => {
  const event = findEventById(c.req.param('id'), { admin: true })
  if (!event) return c.json({ code: 404, msg: '活动不存在' }, 404)
  return c.json({ code: 0, data: listEventSignups(c.req.param('id')) })
})

eventRoutes.post('/admin/signups/:signupId/cancel', requireAuth, requireCsrf, (c) => {
  const signup = adminCancelSignup(c.req.param('signupId'))
  if (!signup) return c.json({ code: 404, msg: '报名记录不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '活动',
    action: '取消报名',
    detail: `报名 #${c.req.param('signupId')}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已取消报名', data: signup })
})

eventRoutes.post('/admin', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const event = createEvent(body)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '活动',
      action: '新增',
      detail: event.title,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '已创建', data: event }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

eventRoutes.put('/admin/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const event = updateEvent(c.req.param('id'), body)
    if (!event) return c.json({ code: 404, msg: '活动不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: event })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

eventRoutes.delete('/admin/:id', requireAuth, requireCsrf, (c) => {
  if (!deleteEvent(c.req.param('id'))) return c.json({ code: 404, msg: '活动不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '活动',
    action: '删除',
    detail: `活动 #${c.req.param('id')}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})

eventRoutes.get('/', optionalAuth, (c) => {
  const member = c.get('member')
  const memberId = member?.sub ? Number(member.sub) : null
  const rows = listEvents({
    category: c.req.query('category') || '',
    q: c.req.query('q') || '',
    memberId,
    upcomingOnly: c.req.query('upcoming') === '1',
  })
  return c.json({ code: 0, data: rows })
})

eventRoutes.get('/:key', optionalAuth, (c) => {
  const key = c.req.param('key')
  const member = c.get('member')
  const memberId = member?.sub ? Number(member.sub) : null
  const event = /^\d+$/.test(key)
    ? findEventById(key, { memberId })
    : findEventBySlug(key, { memberId })
  if (!event) return c.json({ code: 404, msg: '活动不存在' }, 404)
  return c.json({ code: 0, data: event })
})

eventRoutes.post('/:id/signup', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  try {
    const memberId = Number(c.get('member').sub)
    const result = signupEvent(memberId, c.req.param('id'), body)
    const msg =
      result.spent > 0 ? `报名成功，消耗 ${result.spent} 积分` : '报名成功'
    return c.json({ code: 0, msg, data: result })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

eventRoutes.post('/:id/cancel', requireCommunityAuth, requireCsrf, (c) => {
  try {
    const memberId = Number(c.get('member').sub)
    const event = cancelSignup(memberId, c.req.param('id'))
    return c.json({ code: 0, msg: '已取消报名', data: event })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})
