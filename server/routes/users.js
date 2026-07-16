import { Hono } from 'hono'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  findUserById,
  publicUser,
  findUserByUsername,
} from '../db/users.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCsrf } from '../middleware/auth.js'
import { renderUserRows } from '../views/users.js'

export const userRoutes = new Hono()

userRoutes.use('*', requireAuth)

userRoutes.get('/', (c) => {
  const q = c.req.query()
  const page = Number(q.page || 1)
  const pageSize = Number(q.pageSize || 10)
  const { rows, total } = listUsers({
    keyword: q.keyword || '',
    role: q.role || '',
    status: q.status || '',
    page,
    pageSize,
  })
  c.header('X-Total-Count', String(total))
  return c.html(renderUserRows(rows))
})

userRoutes.get('/json', (c) => {
  const q = c.req.query()
  const result = listUsers({
    keyword: q.keyword || '',
    role: q.role || '',
    status: q.status || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 10),
  })
  return c.json({
    code: 0,
    data: {
      ...result,
      rows: result.rows.map(publicUser),
    },
  })
})

userRoutes.get('/:id', (c) => {
  const user = findUserById(c.req.param('id'))
  if (!user) return c.json({ code: 404, msg: '用户不存在' }, 404)
  return c.json({ code: 0, data: publicUser(user) })
})

userRoutes.post('/', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  if (!body.username?.trim() || !body.phone?.trim() || !body.role) {
    return c.json({ code: 400, msg: '用户名、手机号、角色必填' }, 400)
  }
  if (findUserByUsername(body.username.trim())) {
    return c.json({ code: 409, msg: '用户名已存在' }, 409)
  }
  if (!/^1[3-9]\d{9}$/.test(String(body.phone).trim())) {
    return c.json({ code: 400, msg: '手机号格式不正确' }, 400)
  }
  const user = createUser(body)
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '用户管理',
    action: '新增',
    detail: `新增用户 ${user.username}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '创建成功', data: publicUser(user) }, 201)
})

userRoutes.put('/:id', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const user = updateUser(c.req.param('id'), body)
  if (!user) return c.json({ code: 404, msg: '用户不存在' }, 404)
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '用户管理',
    action: '编辑',
    detail: `更新用户 ${user.username}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '更新成功', data: publicUser(user) })
})

userRoutes.delete('/:id', requireCsrf, (c) => {
  const id = c.req.param('id')
  const existing = findUserById(id)
  const ok = deleteUser(id)
  if (!ok) {
    return c.html(
      '<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">删除失败（不存在或受保护账号）</td></tr>',
      400,
    )
  }
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '用户管理',
    action: '删除',
    detail: `删除用户 ${existing?.username || id}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  const { rows } = listUsers({ page: 1, pageSize: 10 })
  return c.html(renderUserRows(rows))
})
