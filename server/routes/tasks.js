import { Hono } from 'hono'
import {
  listTasks,
  listTasksForMember,
  findTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  updateTaskProgress,
  completeTask,
  taskStats,
  listTaskCompletions,
  TASK_TYPES,
} from '../db/tasks.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCommunityAuth, requireCsrf } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optional-auth.js'

export const taskRoutes = new Hono()

taskRoutes.get('/types', (c) =>
  c.json({
    code: 0,
    data: TASK_TYPES.map((t) => ({
      key: t,
      label:
        ({ read: '阅读文章', video: '观看视频', audio: '收听音频', quiz: '答题测验', post: '论坛发帖' })[t] ||
        t,
    })),
  }),
)

taskRoutes.get('/stats', requireAuth, (c) => c.json({ code: 0, data: taskStats() }))

/** Admin list (all statuses) */
taskRoutes.get('/admin', requireAuth, (c) => {
  const q = c.req.query()
  const rows = listTasks({
    status: q.status || '',
    type: q.type || '',
    q: q.q || '',
    includeDrafts: true,
  })
  return c.json({ code: 0, data: rows })
})

taskRoutes.get('/admin/completions', requireAuth, (c) => {
  return c.json({
    code: 0,
    data: listTaskCompletions({
      taskId: c.req.query('taskId') || null,
      limit: c.req.query('limit') || 50,
    }),
  })
})

taskRoutes.get('/admin/:id/completions', requireAuth, (c) => {
  const task = findTaskById(c.req.param('id'))
  if (!task) return c.json({ code: 404, msg: '任务不存在' }, 404)
  return c.json({
    code: 0,
    data: listTaskCompletions({ taskId: c.req.param('id'), limit: c.req.query('limit') || 100 }),
  })
})

taskRoutes.post('/admin', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const task = createTask(body)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '任务',
      action: '新增',
      detail: task.title,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '已创建', data: task }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

taskRoutes.put('/admin/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const task = updateTask(c.req.param('id'), body)
    if (!task) return c.json({ code: 404, msg: '任务不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: task })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

taskRoutes.delete('/admin/:id', requireAuth, requireCsrf, (c) => {
  if (!deleteTask(c.req.param('id'))) return c.json({ code: 404, msg: '任务不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '任务',
    action: '删除',
    detail: `任务 #${c.req.param('id')}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})

/** Public list — with progress when logged in */
taskRoutes.get('/', optionalAuth, (c) => {
  const type = c.req.query('type') || ''
  const member = c.get('member')
  if (member?.sub) {
    return c.json({ code: 0, data: listTasksForMember(Number(member.sub), { type }) })
  }
  return c.json({ code: 0, data: listTasks({ type }) })
})

taskRoutes.get('/:id', optionalAuth, (c) => {
  const task = findTaskById(c.req.param('id'))
  if (!task) return c.json({ code: 404, msg: '任务不存在' }, 404)
  if (task.status !== 'active') return c.json({ code: 404, msg: '任务未开放' }, 404)
  const member = c.get('member')
  if (member?.sub) {
    const rows = listTasksForMember(Number(member.sub))
    const one = rows.find((t) => t.id === Number(c.req.param('id')))
    return c.json({ code: 0, data: one || task })
  }
  return c.json({ code: 0, data: task })
})

taskRoutes.post('/:id/start', requireCommunityAuth, requireCsrf, (c) => {
  try {
    const memberId = Number(c.get('member').sub)
    const data = startTask(c.req.param('id'), memberId)
    return c.json({ code: 0, msg: '已开始', data })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

taskRoutes.post('/:id/progress', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  try {
    const memberId = Number(c.get('member').sub)
    const data = updateTaskProgress(c.req.param('id'), memberId, body)
    return c.json({ code: 0, data })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

taskRoutes.post('/:id/complete', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  try {
    const memberId = Number(c.get('member').sub)
    const result = completeTask(c.req.param('id'), memberId, body)
    return c.json({
      code: 0,
      msg: `任务完成，+${result.earned} 积分`,
      data: result,
    })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})
