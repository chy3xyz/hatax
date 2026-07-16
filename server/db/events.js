import { db } from './sqlite.js'
import { mdToHtml } from '../lib/markdown.js'
import { findMemberById, spendPoints } from './members.js'

export const EVENT_CATEGORIES = ['conference', 'healing', 'online', 'meetup', 'other']
export const EVENT_MODES = ['offline', 'online', 'hybrid']
export const EVENT_STATUSES = ['draft', 'published', 'closed', 'archived']

const CATEGORY_LABELS = {
  conference: '产业大会',
  healing: '疗愈活动',
  online: '线上大会',
  meetup: '线下沙龙',
  other: '其他活动',
}

const MODE_LABELS = {
  offline: '线下',
  online: '线上',
  hybrid: '线上+线下',
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueSlug(desired, excludeId = null) {
  let slug = desired || `event-${Date.now()}`
  let n = 2
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM community_events WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM community_events WHERE slug = ?`).get(slug)
    if (!row) return slug
    slug = `${desired}-${n++}`
  }
}

function signupCount(eventId) {
  return db
    .prepare(
      `SELECT COUNT(*) AS c FROM community_event_signups
       WHERE event_id = ? AND status != 'cancelled'`,
    )
    .get(eventId).c
}

function findSignup(memberId, eventId) {
  if (!memberId) return null
  return db
    .prepare(
      `SELECT * FROM community_event_signups
       WHERE member_id = ? AND event_id = ? AND status != 'cancelled'`,
    )
    .get(memberId, eventId)
}

function mapSignup(row) {
  if (!row) return null
  return {
    id: row.id,
    eventId: row.event_id,
    memberId: row.member_id,
    contactName: row.contact_name || '',
    contactPhone: row.contact_phone || '',
    note: row.note || '',
    status: row.status,
    pointsSpent: Number(row.points_spent || 0),
    createdAt: row.created_at,
  }
}

function mapEvent(row, { memberId = null, includeBody = false, admin = false } = {}) {
  if (!row) return null
  const capacity = Number(row.capacity || 0)
  const signed = signupCount(row.id)
  const signup = findSignup(memberId, row.id)
  const fee = Number(row.fee_points || 0)
  const deadline = row.signup_deadline || null
  const now = nowStr()
  const pastDeadline = deadline ? deadline < now : false
  const full = capacity > 0 && signed >= capacity
  const ended = row.ends_at && row.ends_at < now
  const open =
    row.status === 'published' &&
    !ended &&
    !pastDeadline &&
    (capacity === 0 || signed < capacity)

  const base = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    coverUrl: row.cover_url || '',
    category: row.category,
    categoryLabel: CATEGORY_LABELS[row.category] || row.category,
    mode: row.mode,
    modeLabel: MODE_LABELS[row.mode] || row.mode,
    location: row.location || '',
    onlineUrl: admin || signup ? row.online_url || '' : '',
    startsAt: row.starts_at,
    endsAt: row.ends_at || '',
    signupDeadline: deadline || '',
    capacity,
    signupCount: signed,
    seatsLeft: capacity > 0 ? Math.max(0, capacity - signed) : null,
    feePoints: fee,
    summary: row.summary || '',
    status: row.status,
    sort: Number(row.sort || 0),
    registered: !!signup,
    signup: signup ? mapSignup(signup) : null,
    signupOpen: open && !signup,
    full,
    ended: !!ended,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (includeBody) {
    base.bodyMd = row.body_md || ''
    base.bodyHtml = mdToHtml(row.body_md || '')
  }
  return base
}

export function listEvents({
  category = '',
  q = '',
  status = 'published',
  includeDrafts = false,
  memberId = null,
  upcomingOnly = false,
} = {}) {
  const where = []
  const params = []
  if (!includeDrafts) {
    where.push(`status = 'published'`)
  } else if (status) {
    where.push(`status = ?`)
    params.push(status)
  }
  if (category) {
    where.push(`category = ?`)
    params.push(category)
  }
  if (q) {
    where.push(`(title LIKE ? OR subtitle LIKE ? OR summary LIKE ? OR location LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like, like, like)
  }
  if (upcomingOnly) {
    where.push(`(ends_at IS NULL OR ends_at = '' OR ends_at >= ?)`)
    params.push(nowStr())
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT * FROM community_events ${whereSql}
       ORDER BY sort ASC, starts_at ASC, id DESC`,
    )
    .all(...params)
  return rows.map((r) => mapEvent(r, { memberId }))
}

export function findEventById(id, { memberId = null, admin = false } = {}) {
  const row = db.prepare(`SELECT * FROM community_events WHERE id = ?`).get(id)
  if (!row) return null
  if (!admin && row.status !== 'published' && row.status !== 'closed') return null
  return mapEvent(row, { memberId, includeBody: true, admin })
}

export function findEventBySlug(slug, { memberId = null, admin = false } = {}) {
  const row = db.prepare(`SELECT * FROM community_events WHERE slug = ?`).get(slug)
  if (!row) return null
  if (!admin && row.status !== 'published' && row.status !== 'closed') return null
  return mapEvent(row, { memberId, includeBody: true, admin })
}

export function listMySignups(memberId) {
  const rows = db
    .prepare(
      `SELECT e.*, s.created_at AS signed_at, s.status AS signup_status, s.points_spent, s.id AS signup_id
       FROM community_event_signups s
       JOIN community_events e ON e.id = s.event_id
       WHERE s.member_id = ? AND s.status != 'cancelled'
       ORDER BY s.id DESC`,
    )
    .all(memberId)
  return rows.map((r) => {
    const event = mapEvent(r, { memberId, includeBody: false })
    return {
      ...event,
      signedAt: r.signed_at,
      signupStatus: r.signup_status,
      pointsSpent: Number(r.points_spent || 0),
      signupId: r.signup_id,
    }
  })
}

export function createEvent(data) {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('标题必填')
  const category = String(data.category || 'other')
  if (!EVENT_CATEGORIES.includes(category)) throw new Error('活动分类无效')
  const mode = String(data.mode || 'offline')
  if (!EVENT_MODES.includes(mode)) throw new Error('活动形式无效')
  const startsAt = String(data.startsAt || data.starts_at || '').trim()
  if (!startsAt) throw new Error('开始时间必填')
  const status = data.status || 'published'
  if (!EVENT_STATUSES.includes(status)) throw new Error('状态无效')
  const slug = uniqueSlug(slugify(data.slug || title))
  const now = nowStr()
  const info = db
    .prepare(
      `INSERT INTO community_events
        (slug, title, subtitle, cover_url, category, mode, location, online_url,
         starts_at, ends_at, signup_deadline, capacity, fee_points, summary, body_md,
         status, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      title,
      String(data.subtitle || ''),
      String(data.coverUrl || data.cover_url || ''),
      category,
      mode,
      String(data.location || ''),
      String(data.onlineUrl || data.online_url || ''),
      startsAt,
      String(data.endsAt || data.ends_at || ''),
      String(data.signupDeadline || data.signup_deadline || ''),
      Math.max(0, Number(data.capacity || 0)),
      Math.max(0, Number(data.feePoints ?? data.fee_points ?? 0)),
      String(data.summary || ''),
      String(data.bodyMd || data.body_md || ''),
      status,
      Number(data.sort || 0),
      now,
      now,
    )
  return findEventById(info.lastInsertRowid, { admin: true })
}

export function updateEvent(id, data) {
  const existing = db.prepare(`SELECT * FROM community_events WHERE id = ?`).get(id)
  if (!existing) return null
  const title = data.title != null ? String(data.title).trim() : existing.title
  if (!title) throw new Error('标题必填')
  const category = data.category != null ? String(data.category) : existing.category
  if (!EVENT_CATEGORIES.includes(category)) throw new Error('活动分类无效')
  const mode = data.mode != null ? String(data.mode) : existing.mode
  if (!EVENT_MODES.includes(mode)) throw new Error('活动形式无效')
  const status = data.status != null ? data.status : existing.status
  if (!EVENT_STATUSES.includes(status)) throw new Error('状态无效')
  let slug = existing.slug
  if (data.slug != null) slug = uniqueSlug(slugify(data.slug) || existing.slug, Number(id))
  const startsAt =
    data.startsAt != null || data.starts_at != null
      ? String(data.startsAt ?? data.starts_at).trim()
      : existing.starts_at
  if (!startsAt) throw new Error('开始时间必填')
  const now = nowStr()
  db.prepare(
    `UPDATE community_events SET
      slug=?, title=?, subtitle=?, cover_url=?, category=?, mode=?, location=?, online_url=?,
      starts_at=?, ends_at=?, signup_deadline=?, capacity=?, fee_points=?, summary=?, body_md=?,
      status=?, sort=?, updated_at=?
     WHERE id=?`,
  ).run(
    slug,
    title,
    data.subtitle != null ? String(data.subtitle) : existing.subtitle,
    data.coverUrl != null || data.cover_url != null
      ? String(data.coverUrl ?? data.cover_url)
      : existing.cover_url,
    category,
    mode,
    data.location != null ? String(data.location) : existing.location,
    data.onlineUrl != null || data.online_url != null
      ? String(data.onlineUrl ?? data.online_url)
      : existing.online_url,
    startsAt,
    data.endsAt != null || data.ends_at != null
      ? String(data.endsAt ?? data.ends_at)
      : existing.ends_at,
    data.signupDeadline != null || data.signup_deadline != null
      ? String(data.signupDeadline ?? data.signup_deadline)
      : existing.signup_deadline,
    data.capacity != null ? Math.max(0, Number(data.capacity)) : existing.capacity,
    data.feePoints != null || data.fee_points != null
      ? Math.max(0, Number(data.feePoints ?? data.fee_points))
      : existing.fee_points,
    data.summary != null ? String(data.summary) : existing.summary,
    data.bodyMd != null || data.body_md != null
      ? String(data.bodyMd ?? data.body_md)
      : existing.body_md,
    status,
    data.sort != null ? Number(data.sort) : existing.sort,
    now,
    id,
  )
  return findEventById(id, { admin: true })
}

export function deleteEvent(id) {
  return db.prepare(`DELETE FROM community_events WHERE id = ?`).run(id).changes > 0
}

export function signupEvent(memberId, eventId, { contactName = '', contactPhone = '', note = '' } = {}) {
  const row = db.prepare(`SELECT * FROM community_events WHERE id = ?`).get(eventId)
  if (!row) throw new Error('活动不存在')
  if (row.status !== 'published') throw new Error('活动未开放报名')

  const now = nowStr()
  if (row.signup_deadline && row.signup_deadline < now) throw new Error('报名已截止')
  if (row.ends_at && row.ends_at < now) throw new Error('活动已结束')

  const existing = findSignup(memberId, eventId)
  if (existing) throw new Error('您已报名该活动')

  const capacity = Number(row.capacity || 0)
  const signed = signupCount(eventId)
  if (capacity > 0 && signed >= capacity) throw new Error('名额已满')

  const name = String(contactName || '').trim()
  if (!name) throw new Error('请填写联系人姓名')
  const phone = String(contactPhone || '').trim()
  if (!phone) throw new Error('请填写联系电话')

  const fee = Number(row.fee_points || 0)
  const member = findMemberById(memberId)
  if (!member) throw new Error('账号不存在')

  const tx = db.transaction(() => {
    let pointsSpent = 0
    if (fee > 0) {
      spendPoints(memberId, fee, `活动报名：${row.title}`, { refType: 'event', refId: eventId })
      pointsSpent = fee
    }
    const info = db
      .prepare(
        `INSERT INTO community_event_signups
          (event_id, member_id, contact_name, contact_phone, note, status, points_spent, created_at)
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
      )
      .run(eventId, memberId, name.slice(0, 40), phone.slice(0, 30), String(note || '').slice(0, 200), pointsSpent, now)
    return info.lastInsertRowid
  })
  const signupId = tx()
  const updated = findMemberById(memberId)
  return {
    event: findEventById(eventId, { memberId }),
    signup: mapSignup(db.prepare(`SELECT * FROM community_event_signups WHERE id = ?`).get(signupId)),
    member: {
      id: updated.id,
      points: updated.points,
      displayName: updated.displayName,
      username: updated.username,
    },
    spent: fee,
  }
}

export function cancelSignup(memberId, eventId) {
  const row = db.prepare(`SELECT * FROM community_events WHERE id = ?`).get(eventId)
  if (!row) throw new Error('活动不存在')
  const signup = findSignup(memberId, eventId)
  if (!signup) throw new Error('未报名该活动')
  const now = nowStr()
  if (row.starts_at && row.starts_at < now) throw new Error('活动已开始，无法取消')
  // Points already spent are not refunded by default (simple policy)
  db.prepare(
    `UPDATE community_event_signups SET status = 'cancelled' WHERE id = ?`,
  ).run(signup.id)
  return findEventById(eventId, { memberId })
}

export function listEventSignups(eventId) {
  const rows = db
    .prepare(
      `SELECT s.*, m.username, m.display_name
       FROM community_event_signups s
       JOIN community_members m ON m.id = s.member_id
       WHERE s.event_id = ? AND s.status != 'cancelled'
       ORDER BY s.id DESC`,
    )
    .all(eventId)
  return rows.map((r) => ({
    ...mapSignup(r),
    username: r.username,
    displayName: r.display_name || r.username,
  }))
}

export function eventStats() {
  const total = db.prepare(`SELECT COUNT(*) AS c FROM community_events`).get().c
  const published = db.prepare(`SELECT COUNT(*) AS c FROM community_events WHERE status = 'published'`).get().c
  const signups = db
    .prepare(`SELECT COUNT(*) AS c FROM community_event_signups WHERE status != 'cancelled'`)
    .get().c
  return { total, published, signups }
}

export function adminCancelSignup(signupId) {
  const row = db.prepare(`SELECT * FROM community_event_signups WHERE id = ?`).get(signupId)
  if (!row) return null
  if (row.status === 'cancelled') return mapSignup(row)
  db.prepare(`UPDATE community_event_signups SET status = 'cancelled' WHERE id = ?`).run(signupId)
  return mapSignup(db.prepare(`SELECT * FROM community_event_signups WHERE id = ?`).get(signupId))
}

export function seedEventsIfEmpty() {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM community_events`).get().c
  if (count > 0) return

  const y = new Date().getFullYear()
  createEvent({
    title: `${y} 产业创新大会`,
    subtitle: '连接产业 · 共创未来',
    category: 'conference',
    mode: 'hybrid',
    location: '上海世博中心 · 3 号厅',
    onlineUrl: 'https://example.com/live/industry',
    startsAt: `${y}-09-18 09:30:00`,
    endsAt: `${y}-09-18 17:30:00`,
    signupDeadline: `${y}-09-15 23:59:00`,
    capacity: 200,
    feePoints: 0,
    summary: '聚焦先进制造、供应链与数字化转型，汇聚企业高管与产业伙伴。',
    bodyMd: `## 议程亮点

1. 开幕式与主题演讲
2. 产业圆桌：数字化落地路径
3. 对接洽谈与展区参观

## 适合谁

企业决策者、产品负责人、社区伙伴。

报名成功后将收到参会指引；线上观众可在活动开始前解锁直播入口。`,
    status: 'published',
    sort: 1,
  })

  createEvent({
    title: '周末颂钵疗愈体验',
    subtitle: '声音疗愈 · 身心放松',
    category: 'healing',
    mode: 'offline',
    location: '社区静心空间（报名后告知详细地址）',
    startsAt: `${y}-08-10 14:00:00`,
    endsAt: `${y}-08-10 16:00:00`,
    signupDeadline: `${y}-08-09 12:00:00`,
    capacity: 24,
    feePoints: 8,
    summary: '在颂钵与引导下放松身体、安顿情绪。名额有限，可用少量积分预约。',
    bodyMd: `## 流程

- 14:00 到场静坐
- 14:20 颂钵引导
- 15:30 分享与茶歇

## 提示

请穿着宽松衣物，活动期间请将手机静音。积分用于预约占位，取消报名不退还积分。`,
    status: 'published',
    sort: 2,
  })

  createEvent({
    title: '线上数字经济大会',
    subtitle: '云端连线 · 洞察趋势',
    category: 'online',
    mode: 'online',
    location: '线上直播',
    onlineUrl: 'https://example.com/live/digital-economy',
    startsAt: `${y}-10-22 19:30:00`,
    endsAt: `${y}-10-22 21:30:00`,
    signupDeadline: `${y}-10-22 18:00:00`,
    capacity: 0,
    feePoints: 0,
    summary: '数字经济政策解读、案例分享与问答互动，足不出户参与。',
    bodyMd: `## 议题

- 数字经济新基建
- 平台生态与合规
- 社区共创机会

报名后可在活动页查看直播链接。免费参加，欢迎转发邀请伙伴。`,
    status: 'published',
    sort: 0,
  })
}
