import { Hono } from 'hono'
import { listLoginLogs, listOpLogs } from '../db/logs.js'
import { requireAuth } from '../middleware/auth.js'

export const logRoutes = new Hono()
logRoutes.use('*', requireAuth)

logRoutes.get('/login', (c) => {
  const q = c.req.query()
  const data = listLoginLogs({
    keyword: q.keyword || '',
    status: q.status || '',
    dateStart: q.dateStart || '',
    dateEnd: q.dateEnd || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 10),
    sortField: q.sortField || 'created_at',
    sortDir: q.sortDir || 'desc',
  })
  return c.json({ code: 0, data })
})

logRoutes.get('/ops', (c) => {
  const q = c.req.query()
  const data = listOpLogs({
    keyword: q.keyword || q.operator || '',
    module: q.module || '',
    action: q.action || '',
    status: q.status || '',
    dateStart: q.dateStart || '',
    dateEnd: q.dateEnd || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 10),
    sortField: q.sortField || 'created_at',
    sortDir: q.sortDir || 'desc',
  })
  return c.json({ code: 0, data })
})
