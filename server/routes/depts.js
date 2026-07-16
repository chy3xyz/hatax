import { Hono } from 'hono'
import {
  listDepts,
  buildDeptTree,
  findDeptById,
  createDept,
  updateDept,
  deleteDept,
} from '../db/depts.js'
import { addOpLog } from '../db/logs.js'
import { requireAuth, requireCsrf } from '../middleware/auth.js'
import { renderDeptRows } from '../views/depts.js'

export const deptRoutes = new Hono()
deptRoutes.use('*', requireAuth)

/** HTMX tree rows */
deptRoutes.get('/', (c) => {
  const format = c.req.query('format')
  const tree = buildDeptTree(listDepts())
  if (format === 'json') {
    return c.json({ code: 0, data: { tree, flat: listDepts() } })
  }
  return c.html(renderDeptRows(tree) || '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">暂无部门</td></tr>')
})

deptRoutes.get('/:id', (c) => {
  const dept = findDeptById(c.req.param('id'))
  if (!dept) return c.json({ code: 404, msg: '部门不存在' }, 404)
  return c.json({ code: 0, data: dept })
})

deptRoutes.post('/', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  if (!body.name?.trim()) return c.json({ code: 400, msg: '部门名称必填' }, 400)
  const dept = createDept(body)
  const actor = c.get('user')
  addOpLog({
    operator: actor?.username || 'system',
    module: '部门管理',
    action: '新增',
    detail: `新增部门 ${dept.name}`,
    status: 'Success',
  })
  return c.json({ code: 0, msg: '创建成功', data: dept }, 201)
})

deptRoutes.put('/:id', requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const dept = updateDept(c.req.param('id'), body)
  if (!dept) return c.json({ code: 404, msg: '部门不存在' }, 404)
  return c.json({ code: 0, msg: '更新成功', data: dept })
})

deptRoutes.delete('/:id', requireCsrf, (c) => {
  const ok = deleteDept(c.req.param('id'))
  if (!ok) {
    return c.html(
      '<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">删除失败（有子部门或关联用户）</td></tr>',
      400,
    )
  }
  const tree = buildDeptTree(listDepts())
  return c.html(renderDeptRows(tree))
})
