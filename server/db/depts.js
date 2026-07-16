import { db } from './sqlite.js'

function mapDept(row) {
  if (!row) return null
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    sort: row.sort,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function listDepts() {
  return db
    .prepare('SELECT * FROM depts ORDER BY sort ASC, id ASC')
    .all()
    .map(mapDept)
}

export function findDeptById(id) {
  return mapDept(db.prepare('SELECT * FROM depts WHERE id = ?').get(Number(id)))
}

export function createDept(data) {
  const info = db
    .prepare(
      `INSERT INTO depts (parent_id, name, sort, status, created_at)
       VALUES (?, ?, ?, ?, date('now'))`,
    )
    .run(
      data.parentId ?? data.parent_id ?? null,
      data.name,
      data.sort ?? 0,
      data.status || 'active',
    )
  return findDeptById(info.lastInsertRowid)
}

export function updateDept(id, data) {
  const dept = findDeptById(id)
  if (!dept) return null
  db.prepare(
    `UPDATE depts SET parent_id=?, name=?, sort=?, status=? WHERE id=?`,
  ).run(
    data.parentId !== undefined ? data.parentId : dept.parentId,
    data.name ?? dept.name,
    data.sort ?? dept.sort,
    data.status ?? dept.status,
    Number(id),
  )
  return findDeptById(id)
}

export function deleteDept(id) {
  const children = db.prepare('SELECT COUNT(*) AS c FROM depts WHERE parent_id = ?').get(Number(id)).c
  if (children > 0) return false
  const users = db.prepare('SELECT COUNT(*) AS c FROM users WHERE dept_id = ?').get(Number(id)).c
  if (users > 0) return false
  const info = db.prepare('DELETE FROM depts WHERE id = ?').run(Number(id))
  return info.changes > 0
}

/** Flat list → nested tree */
export function buildDeptTree(rows = listDepts()) {
  const map = new Map()
  for (const d of rows) map.set(d.id, { ...d, children: [] })
  const roots = []
  for (const d of map.values()) {
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId).children.push(d)
    } else {
      roots.push(d)
    }
  }
  return roots
}
