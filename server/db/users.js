import bcrypt from 'bcryptjs'
import { db } from './sqlite.js'

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    email: row.email,
    role: row.role_code,
    status: row.status,
    dept: row.dept_id != null ? String(row.dept_id) : '',
    deptId: row.dept_id,
    remark: row.remark || '',
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  }
}

export function findUserByUsername(username) {
  return mapUser(db.prepare('SELECT * FROM users WHERE username = ?').get(username))
}

export function findUserById(id) {
  return mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)))
}

export function listUsers({ keyword = '', role = '', status = '', page = 1, pageSize = 10 } = {}) {
  const kw = `%${keyword.trim().toLowerCase()}%`
  const where = []
  const params = []

  if (keyword.trim()) {
    where.push('(lower(username) LIKE ? OR phone LIKE ? OR lower(IFNULL(email,\'\')) LIKE ?)')
    params.push(kw, `%${keyword.trim()}%`, kw)
  }
  if (role) {
    where.push('role_code = ?')
    params.push(role)
  }
  if (status) {
    where.push('status = ?')
    params.push(status)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${whereSql}`).get(...params).c
  const offset = (Math.max(1, page) - 1) * pageSize
  const rows = db
    .prepare(`SELECT * FROM users ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)
    .map(mapUser)

  return { rows, total, page: Number(page), pageSize: Number(pageSize) }
}

export function createUser(data) {
  const status =
    data.status === '禁用' || data.status === 'disabled' ? 'disabled' : 'active'
  const deptId = data.dept_id ?? (data.dept ? Number(data.dept) || null : null)
  const info = db
    .prepare(
      `INSERT INTO users (username, password_hash, phone, email, role_code, status, dept_id, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))`,
    )
    .run(
      data.username.trim(),
      bcrypt.hashSync(data.password || '123456', 10),
      data.phone.trim(),
      data.email || '',
      data.role || 'user',
      status,
      deptId,
      data.remark || '',
    )
  return findUserById(info.lastInsertRowid)
}

export function updateUser(id, data) {
  const user = findUserById(id)
  if (!user) return null
  const status =
    data.status === '禁用' || data.status === 'disabled'
      ? 'disabled'
      : data.status === '正常' || data.status === 'active'
        ? 'active'
        : (data.status ?? user.status)
  const deptId =
    data.dept_id !== undefined
      ? data.dept_id
      : data.dept !== undefined
        ? Number(data.dept) || null
        : user.deptId
  db.prepare(
    `UPDATE users SET phone=?, email=?, role_code=?, status=?, dept_id=?, remark=? WHERE id=?`,
  ).run(
    data.phone ?? user.phone,
    data.email ?? user.email,
    data.role ?? user.role,
    status,
    deptId,
    data.remark ?? user.remark,
    Number(id),
  )
  return findUserById(id)
}

export function deleteUser(id) {
  const user = findUserById(id)
  if (!user || user.username === 'admin') return false
  db.prepare('DELETE FROM users WHERE id = ?').run(Number(id))
  return true
}

export function publicUser(u) {
  if (!u) return null
  const { passwordHash, ...rest } = u
  void passwordHash
  return rest
}
