import { Hono } from 'hono'
import {
  listRoles,
  findRoleById,
  findRoleByCode,
  createRole,
  updateRole,
  deleteRole,
} from '../db/roles.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCsrf } from '../middleware/auth.js'

export const roleRoutes = new Hono()
roleRoutes.use('*', requireAuth)

roleRoutes.get('/', (c) => {
  return c.json({ code: 0, data: listRoles() })
})

roleRoutes.get('/:id', (c) => {
  const role = findRoleById(c.req.param('id'))
  if (!role) return c.json({ code: 404, msg: '角色不存在' }, 404)
  return c.json({ code: 0, data: role })
})

roleRoutes.post('/', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  if (!body.code?.trim() || !body.name?.trim()) {
    return c.json({ code: 400, msg: '编码和名称必填' }, 400)
  }
  if (findRoleByCode(body.code.trim())) {
    return c.json({ code: 409, msg: '角色编码已存在' }, 409)
  }
  const role = createRole({
    code: body.code.trim(),
    name: body.name.trim(),
    description: body.description || '',
    permissions: body.permissions || [],
    sort: body.sort,
  })
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '角色权限',
    action: '新增',
    detail: `新增角色 ${role.name}`,
    status: 'Success',
  })
  return c.json({ code: 0, msg: '创建成功', data: role }, 201)
})

roleRoutes.put('/:id', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const role = updateRole(c.req.param('id'), body)
  if (!role) return c.json({ code: 404, msg: '角色不存在' }, 404)
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '角色权限',
    action: '编辑',
    detail: `更新角色 ${role.name} 权限`,
    status: 'Success',
  })
  return c.json({ code: 0, msg: '保存成功', data: role })
})

roleRoutes.delete('/:id', requireCsrf, (c) => {
  const ok = deleteRole(c.req.param('id'))
  if (!ok) return c.json({ code: 400, msg: '无法删除（受保护或仍有用户）' }, 400)
  return c.json({ code: 0, msg: '已删除' })
})
