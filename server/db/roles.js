import { db } from './sqlite.js'

function mapRole(row) {
  if (!row) return null
  let permissions = []
  try {
    permissions = JSON.parse(row.permissions || '[]')
  } catch {
    permissions = []
  }
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    permissions,
    sort: row.sort,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function listRoles() {
  return db.prepare('SELECT * FROM roles ORDER BY sort ASC, id ASC').all().map(mapRole)
}

export function findRoleById(id) {
  return mapRole(db.prepare('SELECT * FROM roles WHERE id = ?').get(Number(id)))
}

export function findRoleByCode(code) {
  return mapRole(db.prepare('SELECT * FROM roles WHERE code = ?').get(code))
}

export function createRole(data) {
  const info = db
    .prepare(
      `INSERT INTO roles (code, name, description, permissions, sort, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.code,
      data.name,
      data.description || '',
      JSON.stringify(data.permissions || []),
      data.sort ?? 99,
      data.status || 'active',
    )
  return findRoleById(info.lastInsertRowid)
}

export function updateRole(id, data) {
  const role = findRoleById(id)
  if (!role) return null
  db.prepare(
    `UPDATE roles SET name=?, description=?, permissions=?, sort=?, status=? WHERE id=?`,
  ).run(
    data.name ?? role.name,
    data.description ?? role.description,
    JSON.stringify(data.permissions ?? role.permissions),
    data.sort ?? role.sort,
    data.status ?? role.status,
    Number(id),
  )
  return findRoleById(id)
}

export function deleteRole(id) {
  const role = findRoleById(id)
  if (!role || role.code === 'admin') return false
  const used = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role_code = ?').get(role.code).c
  if (used > 0) return false
  db.prepare('DELETE FROM roles WHERE id = ?').run(Number(id))
  return true
}
