import bcrypt from 'bcryptjs'
import { db } from './sqlite.js'

export const POINT_RULES = {
  register: { delta: 10, reason: '注册奖励' },
  work: { delta: 8, reason: '发表博客' },
  topic: { delta: 5, reason: '论坛发帖' },
  reply: { delta: 2, reason: '回复帖子' },
  like: { delta: 1, reason: '点赞互动' },
  liked: { delta: 2, reason: '内容被赞' },
}

export function mapMember(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    displayName: row.display_name || row.username,
    bio: row.bio || '',
    points: Number(row.points || 0),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function publicMember(member) {
  if (!member) return null
  return {
    id: member.id,
    username: member.username,
    email: member.email,
    displayName: member.displayName,
    bio: member.bio,
    points: member.points,
    status: member.status,
    createdAt: member.createdAt,
  }
}

export function findMemberByUsername(username) {
  const row = db.prepare(`SELECT * FROM community_members WHERE username = ?`).get(username)
  if (!row) return null
  return { ...mapMember(row), passwordHash: row.password_hash }
}

export function findMemberByEmail(email) {
  if (!email) return null
  const row = db.prepare(`SELECT * FROM community_members WHERE email = ?`).get(email)
  if (!row) return null
  return { ...mapMember(row), passwordHash: row.password_hash }
}

export function findMemberById(id) {
  const row = db.prepare(`SELECT * FROM community_members WHERE id = ?`).get(id)
  return mapMember(row)
}

export function registerMember({ username, password, email, displayName }) {
  const name = String(username || '').trim()
  const pass = String(password || '')
  const mail = String(email || '').trim().toLowerCase()
  const nick = String(displayName || '').trim() || name

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(name)) {
    throw new Error('用户名需为 3–24 位字母、数字或下划线')
  }
  if (pass.length < 6) throw new Error('密码至少 6 位')
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    throw new Error('邮箱格式不正确')
  }
  if (findMemberByUsername(name)) throw new Error('用户名已被占用')
  if (mail && findMemberByEmail(mail)) throw new Error('邮箱已被注册')

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const hash = bcrypt.hashSync(pass, 10)
  const welcome = POINT_RULES.register.delta
  const info = db
    .prepare(
      `INSERT INTO community_members
        (username, email, password_hash, display_name, bio, points, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, '', ?, 'active', ?, ?)`,
    )
    .run(name, mail || null, hash, nick, welcome, now, now)

  const id = info.lastInsertRowid
  db.prepare(
    `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, created_at)
     VALUES (?, ?, ?, 'register', ?)`,
  ).run(id, welcome, POINT_RULES.register.reason, now)

  return findMemberById(id)
}

export function updateMemberProfile(id, data) {
  const existing = findMemberById(id)
  if (!existing) return null

  const nick = data.displayName != null ? String(data.displayName).trim() : existing.displayName
  if (!nick) throw new Error('显示名不能为空')
  if (nick.length > 32) throw new Error('显示名最多 32 字')

  let mail = existing.email
  if (data.email != null) {
    mail = String(data.email).trim().toLowerCase()
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      throw new Error('邮箱格式不正确')
    }
    if (mail) {
      const other = findMemberByEmail(mail)
      if (other && other.id !== Number(id)) throw new Error('邮箱已被占用')
    }
  }

  const bio = data.bio != null ? String(data.bio).trim().slice(0, 200) : existing.bio
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  db.prepare(
    `UPDATE community_members SET display_name = ?, email = ?, bio = ?, updated_at = ? WHERE id = ?`,
  ).run(nick, mail || null, bio, now, id)

  return findMemberById(id)
}

export function changeMemberPassword(id, { oldPassword, newPassword }) {
  const row = db.prepare(`SELECT * FROM community_members WHERE id = ?`).get(id)
  if (!row) throw new Error('账号不存在')
  if (!oldPassword || !newPassword) throw new Error('请填写原密码与新密码')
  if (String(newPassword).length < 6) throw new Error('新密码至少 6 位')
  if (!bcrypt.compareSync(String(oldPassword), row.password_hash)) {
    throw new Error('原密码不正确')
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare(`UPDATE community_members SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
    bcrypt.hashSync(String(newPassword), 10),
    now,
    id,
  )
  return true
}

export function awardPoints(memberId, ruleKey, { refType = '', refId = null } = {}) {
  const rule = POINT_RULES[ruleKey]
  if (!rule || !memberId) return null
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const tx = db.transaction(() => {
    db.prepare(`UPDATE community_members SET points = points + ?, updated_at = ? WHERE id = ?`).run(
      rule.delta,
      now,
      memberId,
    )
    db.prepare(
      `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, ref_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(memberId, rule.delta, rule.reason, refType || ruleKey, refId, now)
  })
  tx()
  return findMemberById(memberId)
}

export function listPointLogs(memberId, { limit = 30 } = {}) {
  return db
    .prepare(
      `SELECT id, delta, reason, ref_type AS refType, ref_id AS refId, created_at AS createdAt
       FROM community_point_logs
       WHERE member_id = ?
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(memberId, Math.min(Number(limit) || 30, 100))
}

export function listMembers({ q = '', status = '', page = 1, pageSize = 20 } = {}) {
  const where = []
  const params = []
  if (q) {
    where.push(`(username LIKE ? OR display_name LIKE ? OR email LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like, like)
  }
  if (status === 'active' || status === 'disabled') {
    where.push(`status = ?`)
    params.push(status)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) AS c FROM community_members ${whereSql}`).get(...params).c
  const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize)
  const rows = db
    .prepare(
      `SELECT * FROM community_members ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset)
    .map(mapMember)
  return { total, page: Math.max(1, page), pageSize, rows }
}

export function updateMemberStatus(id, status) {
  if (!['active', 'disabled'].includes(status)) throw new Error('无效状态')
  const existing = findMemberById(id)
  if (!existing) return null
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare(`UPDATE community_members SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    now,
    id,
  )
  return findMemberById(id)
}

export function adjustMemberPoints(id, delta, reason = '后台调整') {
  const existing = findMemberById(id)
  if (!existing) return null
  const d = Number(delta)
  if (!Number.isFinite(d) || d === 0) throw new Error('积分变动不能为 0')
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const tx = db.transaction(() => {
    db.prepare(`UPDATE community_members SET points = MAX(0, points + ?), updated_at = ? WHERE id = ?`).run(
      d,
      now,
      id,
    )
    db.prepare(
      `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, created_at)
       VALUES (?, ?, ?, 'admin', ?)`,
    ).run(id, d, String(reason || '后台调整').slice(0, 80), now)
  })
  tx()
  return findMemberById(id)
}

/** Spend points (delta must be positive amount to deduct). Throws if insufficient. */
export function spendPoints(memberId, amount, reason, { refType = 'course', refId = null } = {}) {
  const cost = Math.abs(Number(amount))
  if (!Number.isFinite(cost) || cost <= 0) throw new Error('扣减积分无效')
  const member = findMemberById(memberId)
  if (!member) throw new Error('账号不存在')
  if (member.points < cost) throw new Error(`积分不足（需要 ${cost}，当前 ${member.points}）`)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `UPDATE community_members SET points = points - ?, updated_at = ?
         WHERE id = ? AND points >= ?`,
      )
      .run(cost, now, memberId, cost)
    if (!info.changes) throw new Error('积分不足')
    db.prepare(
      `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, ref_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(memberId, -cost, String(reason || '积分消费').slice(0, 80), refType, refId, now)
  })
  tx()
  return findMemberById(memberId)
}

export function memberActivityStats(memberId) {
  const topics = db
    .prepare(`SELECT COUNT(*) AS c FROM forum_topics WHERE author_id = ?`)
    .get(memberId).c
  const replies = db
    .prepare(`SELECT COUNT(*) AS c FROM forum_posts WHERE author_id = ?`)
    .get(memberId).c
  const works = db
    .prepare(
      `SELECT COUNT(*) AS c FROM blog_posts WHERE author_kind = 'community' AND author_id = ? AND status = 'published'`,
    )
    .get(memberId).c
  const likesGiven = db
    .prepare(`SELECT COUNT(*) AS c FROM forum_likes WHERE user_id = ?`)
    .get(memberId).c
  const likesReceived = db
    .prepare(
      `SELECT COALESCE(SUM(like_count), 0) AS c FROM (
         SELECT like_count FROM forum_topics WHERE author_id = ?
         UNION ALL
         SELECT like_count FROM forum_posts WHERE author_id = ?
       )`,
    )
    .get(memberId, memberId).c
  return { topics, replies, works, likesGiven, likesReceived: Number(likesReceived || 0) }
}
