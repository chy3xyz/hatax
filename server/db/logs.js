import { db } from './sqlite.js'

function mapLogin(row) {
  return {
    id: row.id,
    username: row.username,
    loginTime: row.created_at,
    time: row.created_at,
    ip: row.ip,
    location: row.location,
    browser: row.browser,
    status: row.status === 'fail' || row.status === 'Failed' ? 'fail' : 'success',
    message: row.message || '',
  }
}

function mapOp(row) {
  return {
    id: row.id,
    operator: row.operator,
    module: row.module,
    action: row.action,
    detail: row.detail,
    ip: row.ip,
    duration: row.duration_ms,
    status: row.status,
    time: row.created_at,
  }
}

export function addLoginLog({ username, ip, location, browser, status, message }) {
  db.prepare(
    `INSERT INTO login_logs (username, ip, location, browser, status, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(username, ip || '', location || '', browser || '', status || 'success', message || '')
}

export function listLoginLogs({
  keyword = '',
  status = '',
  dateStart = '',
  dateEnd = '',
  page = 1,
  pageSize = 10,
  sortField = 'created_at',
  sortDir = 'desc',
} = {}) {
  const where = []
  const params = []
  if (keyword.trim()) {
    where.push('(username LIKE ? OR ip LIKE ?)')
    params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`)
  }
  if (status && status !== 'All' && status !== '全部') {
    const s = status === 'Failed' || status === 'fail' ? 'fail' : 'success'
    where.push('status = ?')
    params.push(s)
  }
  if (dateStart) {
    where.push('date(created_at) >= date(?)')
    params.push(dateStart)
  }
  if (dateEnd) {
    where.push('date(created_at) <= date(?)')
    params.push(dateEnd)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const allowedSort = { username: 'username', time: 'created_at', loginTime: 'created_at', created_at: 'created_at' }
  const col = allowedSort[sortField] || 'created_at'
  const dir = sortDir === 'asc' ? 'ASC' : 'DESC'
  const total = db.prepare(`SELECT COUNT(*) AS c FROM login_logs ${whereSql}`).get(...params).c
  const offset = (Math.max(1, page) - 1) * pageSize
  const rows = db
    .prepare(`SELECT * FROM login_logs ${whereSql} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)
    .map(mapLogin)
  return { rows, total, page: Number(page), pageSize: Number(pageSize) }
}

export function addOpLog({ operator, module, action, detail, ip, durationMs, status }) {
  db.prepare(
    `INSERT INTO op_logs (operator, module, action, detail, ip, duration_ms, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    operator,
    module || '',
    action || '',
    detail || '',
    ip || '',
    durationMs || 0,
    status || 'Success',
  )
}

export function listOpLogs({
  keyword = '',
  module = '',
  action = '',
  status = '',
  dateStart = '',
  dateEnd = '',
  page = 1,
  pageSize = 10,
  sortField = 'created_at',
  sortDir = 'desc',
} = {}) {
  const where = []
  const params = []
  if (keyword.trim()) {
    where.push('(operator LIKE ? OR detail LIKE ?)')
    params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`)
  }
  if (module && module !== 'All' && module !== '全部') {
    where.push('module = ?')
    params.push(module)
  }
  if (action && action !== 'All' && action !== '全部') {
    where.push('action = ?')
    params.push(action)
  }
  if (status && status !== 'All' && status !== '全部') {
    where.push('status = ?')
    params.push(status)
  }
  if (dateStart) {
    where.push('date(created_at) >= date(?)')
    params.push(dateStart)
  }
  if (dateEnd) {
    where.push('date(created_at) <= date(?)')
    params.push(dateEnd)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const allowedSort = { time: 'created_at', created_at: 'created_at', operator: 'operator', duration: 'duration_ms' }
  const col = allowedSort[sortField] || 'created_at'
  const dir = sortDir === 'asc' ? 'ASC' : 'DESC'
  const total = db.prepare(`SELECT COUNT(*) AS c FROM op_logs ${whereSql}`).get(...params).c
  const offset = (Math.max(1, page) - 1) * pageSize
  const rows = db
    .prepare(`SELECT * FROM op_logs ${whereSql} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)
    .map(mapOp)

  const modules = db.prepare(`SELECT DISTINCT module FROM op_logs ORDER BY module`).all().map((r) => r.module)
  const actions = db.prepare(`SELECT DISTINCT action FROM op_logs ORDER BY action`).all().map((r) => r.action)

  return { rows, total, page: Number(page), pageSize: Number(pageSize), modules, actions }
}
