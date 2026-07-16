import { Hono } from 'hono'
import {
  COURSE_TYPES,
  listCourses,
  listMyCourses,
  findCourseById,
  findCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  purchaseCourse,
  courseStats,
  listCoursePurchases,
} from '../db/courses.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCommunityAuth, requireCsrf } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optional-auth.js'

export const courseRoutes = new Hono()

const TYPE_LABELS = { video: '视频课程', article: '文章课程' }

courseRoutes.get('/types', (c) =>
  c.json({
    code: 0,
    data: COURSE_TYPES.map((t) => ({ key: t, label: TYPE_LABELS[t] || t })),
  }),
)

courseRoutes.get('/stats', requireAuth, (c) => c.json({ code: 0, data: courseStats() }))

courseRoutes.get('/mine', requireCommunityAuth, (c) => {
  const memberId = Number(c.get('member').sub)
  return c.json({ code: 0, data: listMyCourses(memberId) })
})

courseRoutes.get('/admin', requireAuth, (c) => {
  const q = c.req.query()
  const rows = listCourses({
    type: q.type || '',
    q: q.q || '',
    status: q.status || '',
    includeDrafts: true,
  })
  return c.json({ code: 0, data: rows })
})

courseRoutes.get('/admin/purchases', requireAuth, (c) => {
  const rows = listCoursePurchases({
    courseId: c.req.query('courseId') || null,
    limit: c.req.query('limit') || 50,
  })
  return c.json({ code: 0, data: rows })
})

courseRoutes.get('/admin/:id', requireAuth, (c) => {
  const course = findCourseById(c.req.param('id'), { admin: true })
  if (!course) return c.json({ code: 404, msg: '课程不存在' }, 404)
  return c.json({ code: 0, data: course })
})

courseRoutes.get('/admin/:id/purchases', requireAuth, (c) => {
  const course = findCourseById(c.req.param('id'), { admin: true })
  if (!course) return c.json({ code: 404, msg: '课程不存在' }, 404)
  return c.json({
    code: 0,
    data: listCoursePurchases({ courseId: c.req.param('id'), limit: c.req.query('limit') || 100 }),
  })
})

courseRoutes.post('/admin', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const course = createCourse(body)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '课程',
      action: '新增',
      detail: course.title,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '已创建', data: course }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

courseRoutes.put('/admin/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const course = updateCourse(c.req.param('id'), body)
    if (!course) return c.json({ code: 404, msg: '课程不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: course })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

courseRoutes.delete('/admin/:id', requireAuth, requireCsrf, (c) => {
  if (!deleteCourse(c.req.param('id'))) return c.json({ code: 404, msg: '课程不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '课程',
    action: '删除',
    detail: `课程 #${c.req.param('id')}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})

courseRoutes.post('/admin/:id/lessons', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const lesson = createLesson(c.req.param('id'), body)
    return c.json({ code: 0, msg: '课时已添加', data: lesson }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

courseRoutes.put('/admin/lessons/:lessonId', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const lesson = updateLesson(c.req.param('lessonId'), body)
    if (!lesson) return c.json({ code: 404, msg: '课时不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: lesson })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

courseRoutes.delete('/admin/lessons/:lessonId', requireAuth, requireCsrf, (c) => {
  if (!deleteLesson(c.req.param('lessonId'))) return c.json({ code: 404, msg: '课时不存在' }, 404)
  return c.json({ code: 0, msg: '已删除' })
})

courseRoutes.get('/', optionalAuth, (c) => {
  const member = c.get('member')
  const memberId = member?.sub ? Number(member.sub) : null
  const rows = listCourses({
    type: c.req.query('type') || '',
    q: c.req.query('q') || '',
    memberId,
  })
  return c.json({ code: 0, data: rows })
})

courseRoutes.get('/:key', optionalAuth, (c) => {
  const key = c.req.param('key')
  const member = c.get('member')
  const memberId = member?.sub ? Number(member.sub) : null
  const course = /^\d+$/.test(key)
    ? findCourseById(key, { memberId })
    : findCourseBySlug(key, { memberId })
  if (!course) return c.json({ code: 404, msg: '课程不存在' }, 404)
  return c.json({ code: 0, data: course })
})

courseRoutes.post('/:id/purchase', requireCommunityAuth, requireCsrf, (c) => {
  try {
    const memberId = Number(c.get('member').sub)
    const result = purchaseCourse(memberId, c.req.param('id'))
    const msg =
      result.spent > 0 ? `购买成功，消耗 ${result.spent} 积分` : '已加入学习（免费课程）'
    return c.json({ code: 0, msg, data: result })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})
