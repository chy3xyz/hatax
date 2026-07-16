import { db } from './sqlite.js'
import { mdToHtml } from '../lib/markdown.js'
import { findMemberById, spendPoints } from './members.js'

export const COURSE_TYPES = ['video', 'article']

const TYPE_LABELS = {
  video: '视频课程',
  article: '文章课程',
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
  let slug = desired || `course-${Date.now()}`
  let n = 2
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM kb_courses WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM kb_courses WHERE slug = ?`).get(slug)
    if (!row) return slug
    slug = `${desired}-${n++}`
  }
}

function mapLesson(row, { unlocked = false } = {}) {
  if (!row) return null
  const free = !!row.is_free
  const canView = unlocked || free
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    sort: Number(row.sort || 0),
    contentType: row.content_type || 'article',
    durationMinutes: Number(row.duration_minutes || 0),
    isFree: free,
    unlocked: canView,
    mediaUrl: canView ? row.media_url || '' : '',
    bodyMd: canView ? row.body_md || '' : '',
    bodyHtml: canView ? mdToHtml(row.body_md || '') : '',
    excerpt: !canView
      ? String(row.body_md || '')
          .replace(/[#*`>\-\[\]]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80)
      : '',
  }
}

function mapCourse(row, { purchased = false, includeLessons = false, lessonUnlocked = false } = {}) {
  if (!row) return null
  const price = Number(row.price_points || 0)
  const owned = purchased || price === 0
  const base = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    coverUrl: row.cover_url || '',
    type: row.type,
    typeLabel: TYPE_LABELS[row.type] || row.type,
    pricePoints: price,
    summary: row.summary || '',
    status: row.status,
    salesCount: Number(row.sales_count || 0),
    lessonCount: Number(row.lesson_count || 0),
    sort: Number(row.sort || 0),
    purchased: owned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (includeLessons) {
    const lessonRows = db
      .prepare(`SELECT * FROM kb_lessons WHERE course_id = ? ORDER BY sort ASC, id ASC`)
      .all(row.id)
    base.lessons = lessonRows.map((l) => mapLesson(l, { unlocked: owned || lessonUnlocked }))
    base.lessonCount = lessonRows.length
    base.introMd = row.intro_md || ''
    base.introHtml = mdToHtml(row.intro_md || '')
    if (owned) {
      base.bodyMd = row.body_md || ''
      base.bodyHtml = mdToHtml(row.body_md || '')
    } else {
      base.bodyMd = ''
      base.bodyHtml = ''
    }
  }
  return base
}

export function listLessons(courseId, { unlocked = true } = {}) {
  return db
    .prepare(`SELECT * FROM kb_lessons WHERE course_id = ? ORDER BY sort ASC, id ASC`)
    .all(courseId)
    .map((r) => mapLesson(r, { unlocked }))
}

function lessonCount(courseId) {
  return db.prepare(`SELECT COUNT(*) AS c FROM kb_lessons WHERE course_id = ?`).get(courseId).c
}

export function hasPurchased(memberId, courseId) {
  if (!memberId) return false
  return !!db
    .prepare(`SELECT id FROM kb_purchases WHERE member_id = ? AND course_id = ?`)
    .get(memberId, courseId)
}

export function findCourseById(id, { memberId = null, admin = false } = {}) {
  const row = db.prepare(`SELECT * FROM kb_courses WHERE id = ?`).get(id)
  if (!row) return null
  if (!admin && row.status !== 'published') return null
  const purchased = admin || hasPurchased(memberId, row.id) || Number(row.price_points || 0) === 0
  row.lesson_count = lessonCount(row.id)
  return mapCourse(row, { purchased, includeLessons: true })
}

export function findCourseBySlug(slug, { memberId = null, admin = false } = {}) {
  const row = db.prepare(`SELECT * FROM kb_courses WHERE slug = ?`).get(slug)
  if (!row) return null
  if (!admin && row.status !== 'published') return null
  const purchased = admin || hasPurchased(memberId, row.id) || Number(row.price_points || 0) === 0
  row.lesson_count = lessonCount(row.id)
  return mapCourse(row, { purchased, includeLessons: true })
}

export function listCourses({
  type = '',
  q = '',
  status = 'published',
  includeDrafts = false,
  memberId = null,
} = {}) {
  const where = []
  const params = []
  if (!includeDrafts) {
    where.push(`status = 'published'`)
  } else if (status) {
    where.push(`status = ?`)
    params.push(status)
  }
  if (type) {
    where.push(`type = ?`)
    params.push(type)
  }
  if (q) {
    where.push(`(title LIKE ? OR subtitle LIKE ? OR summary LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like, like)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT * FROM kb_courses ${whereSql}
       ORDER BY sort ASC, id DESC`,
    )
    .all(...params)

  return rows.map((r) => {
    r.lesson_count = lessonCount(r.id)
    const purchased = hasPurchased(memberId, r.id) || Number(r.price_points || 0) === 0
    return mapCourse(r, { purchased, includeLessons: false })
  })
}

export function listMyCourses(memberId) {
  const rows = db
    .prepare(
      `SELECT c.*, p.created_at AS purchased_at, p.points_spent
       FROM kb_purchases p
       JOIN kb_courses c ON c.id = p.course_id
       WHERE p.member_id = ?
       ORDER BY p.id DESC`,
    )
    .all(memberId)
  return rows.map((r) => {
    r.lesson_count = lessonCount(r.id)
    const course = mapCourse(r, { purchased: true, includeLessons: false })
    return {
      ...course,
      purchasedAt: r.purchased_at,
      pointsSpent: Number(r.points_spent || 0),
    }
  })
}

export function createCourse(data) {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('标题必填')
  const type = String(data.type || 'article')
  if (!COURSE_TYPES.includes(type)) throw new Error('课程类型无效')
  const price = Math.max(0, Number(data.pricePoints ?? data.price_points ?? 0))
  const slug = uniqueSlug(slugify(data.slug || title))
  const now = nowStr()
  const info = db
    .prepare(
      `INSERT INTO kb_courses
        (slug, title, subtitle, cover_url, type, price_points, summary, intro_md, body_md, status, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      title,
      String(data.subtitle || ''),
      String(data.coverUrl || data.cover_url || ''),
      type,
      price,
      String(data.summary || ''),
      String(data.introMd || data.intro_md || ''),
      String(data.bodyMd || data.body_md || ''),
      data.status === 'draft' || data.status === 'archived' ? data.status : 'published',
      Number(data.sort || 0),
      now,
      now,
    )
  const courseId = info.lastInsertRowid
  if (Array.isArray(data.lessons)) {
    for (const [i, lesson] of data.lessons.entries()) {
      createLesson(courseId, { ...lesson, sort: lesson.sort ?? i })
    }
  }
  return findCourseById(courseId, { admin: true })
}

export function updateCourse(id, data) {
  const existing = db.prepare(`SELECT * FROM kb_courses WHERE id = ?`).get(id)
  if (!existing) return null
  const title = data.title != null ? String(data.title).trim() : existing.title
  const type = data.type != null ? String(data.type) : existing.type
  if (!COURSE_TYPES.includes(type)) throw new Error('课程类型无效')
  let slug = existing.slug
  if (data.slug != null) slug = uniqueSlug(slugify(data.slug) || existing.slug, Number(id))
  const price =
    data.pricePoints != null || data.price_points != null
      ? Math.max(0, Number(data.pricePoints ?? data.price_points))
      : existing.price_points
  const status = data.status != null ? data.status : existing.status
  if (!['draft', 'published', 'archived'].includes(status)) throw new Error('状态无效')
  const now = nowStr()
  db.prepare(
    `UPDATE kb_courses SET
      slug=?, title=?, subtitle=?, cover_url=?, type=?, price_points=?,
      summary=?, intro_md=?, body_md=?, status=?, sort=?, updated_at=?
     WHERE id=?`,
  ).run(
    slug,
    title,
    data.subtitle != null ? String(data.subtitle) : existing.subtitle,
    data.coverUrl != null || data.cover_url != null
      ? String(data.coverUrl ?? data.cover_url)
      : existing.cover_url,
    type,
    price,
    data.summary != null ? String(data.summary) : existing.summary,
    data.introMd != null || data.intro_md != null
      ? String(data.introMd ?? data.intro_md)
      : existing.intro_md,
    data.bodyMd != null || data.body_md != null
      ? String(data.bodyMd ?? data.body_md)
      : existing.body_md,
    status,
    data.sort != null ? Number(data.sort) : existing.sort,
    now,
    id,
  )
  if (Array.isArray(data.lessons)) {
    syncLessons(id, data.lessons)
  }
  return findCourseById(id, { admin: true })
}

function syncLessons(courseId, lessons) {
  const existing = db
    .prepare(`SELECT id FROM kb_lessons WHERE course_id = ?`)
    .all(courseId)
    .map((r) => r.id)
  const keep = new Set()
  for (const [i, lesson] of lessons.entries()) {
    const payload = { ...lesson, sort: lesson.sort ?? i }
    if (lesson.id && existing.includes(Number(lesson.id))) {
      updateLesson(lesson.id, payload)
      keep.add(Number(lesson.id))
    } else {
      const created = createLesson(courseId, payload)
      keep.add(created.id)
    }
  }
  for (const lid of existing) {
    if (!keep.has(lid)) deleteLesson(lid)
  }
}

export function deleteCourse(id) {
  const info = db.prepare(`DELETE FROM kb_courses WHERE id = ?`).run(id)
  return info.changes > 0
}

export function createLesson(courseId, data) {
  const course = db.prepare(`SELECT id FROM kb_courses WHERE id = ?`).get(courseId)
  if (!course) throw new Error('课程不存在')
  const title = String(data.title || '').trim()
  if (!title) throw new Error('课时标题必填')
  const contentType = data.contentType || data.content_type || 'article'
  if (!['video', 'article'].includes(contentType)) throw new Error('课时类型无效')
  const now = nowStr()
  const info = db
    .prepare(
      `INSERT INTO kb_lessons
        (course_id, title, sort, content_type, media_url, body_md, duration_minutes, is_free, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      courseId,
      title,
      Number(data.sort || 0),
      contentType,
      String(data.mediaUrl || data.media_url || ''),
      String(data.bodyMd || data.body_md || ''),
      Number(data.durationMinutes || data.duration_minutes || 0),
      data.isFree || data.is_free ? 1 : 0,
      now,
      now,
    )
  return mapLesson(db.prepare(`SELECT * FROM kb_lessons WHERE id = ?`).get(info.lastInsertRowid), {
    unlocked: true,
  })
}

export function updateLesson(id, data) {
  const existing = db.prepare(`SELECT * FROM kb_lessons WHERE id = ?`).get(id)
  if (!existing) return null
  const now = nowStr()
  db.prepare(
    `UPDATE kb_lessons SET
      title=?, sort=?, content_type=?, media_url=?, body_md=?, duration_minutes=?, is_free=?, updated_at=?
     WHERE id=?`,
  ).run(
    data.title != null ? String(data.title).trim() : existing.title,
    data.sort != null ? Number(data.sort) : existing.sort,
    data.contentType || data.content_type || existing.content_type,
    data.mediaUrl != null || data.media_url != null
      ? String(data.mediaUrl ?? data.media_url)
      : existing.media_url,
    data.bodyMd != null || data.body_md != null
      ? String(data.bodyMd ?? data.body_md)
      : existing.body_md,
    data.durationMinutes != null || data.duration_minutes != null
      ? Number(data.durationMinutes ?? data.duration_minutes)
      : existing.duration_minutes,
    data.isFree != null || data.is_free != null
      ? data.isFree || data.is_free
        ? 1
        : 0
      : existing.is_free,
    now,
    id,
  )
  return mapLesson(db.prepare(`SELECT * FROM kb_lessons WHERE id = ?`).get(id), { unlocked: true })
}

export function deleteLesson(id) {
  return db.prepare(`DELETE FROM kb_lessons WHERE id = ?`).run(id).changes > 0
}

export function purchaseCourse(memberId, courseId) {
  const row = db.prepare(`SELECT * FROM kb_courses WHERE id = ?`).get(courseId)
  if (!row || row.status !== 'published') throw new Error('课程不存在或未上架')
  if (hasPurchased(memberId, courseId)) throw new Error('已购买该课程')
  const price = Number(row.price_points || 0)
  const now = nowStr()

  if (price === 0) {
    db.prepare(
      `INSERT INTO kb_purchases (member_id, course_id, points_spent, created_at)
       VALUES (?, ?, 0, ?)`,
    ).run(memberId, courseId, now)
    return {
      course: findCourseById(courseId, { memberId }),
      member: findMemberById(memberId),
      spent: 0,
    }
  }

  const tx = db.transaction(() => {
    const member = spendPoints(memberId, price, `购买课程：${row.title}`, {
      refType: 'course',
      refId: courseId,
    })
    db.prepare(
      `INSERT INTO kb_purchases (member_id, course_id, points_spent, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(memberId, courseId, price, now)
    db.prepare(`UPDATE kb_courses SET sales_count = sales_count + 1, updated_at = ? WHERE id = ?`).run(
      now,
      courseId,
    )
    return member
  })
  const member = tx()
  return {
    course: findCourseById(courseId, { memberId }),
    member: {
      id: member.id,
      points: member.points,
      displayName: member.displayName,
      username: member.username,
    },
    spent: price,
  }
}

export function courseStats() {
  const total = db.prepare(`SELECT COUNT(*) AS c FROM kb_courses`).get().c
  const published = db.prepare(`SELECT COUNT(*) AS c FROM kb_courses WHERE status = 'published'`).get().c
  const sales = db.prepare(`SELECT COUNT(*) AS c FROM kb_purchases`).get().c
  const revenue = db.prepare(`SELECT COALESCE(SUM(points_spent), 0) AS c FROM kb_purchases`).get().c
  return { total, published, sales, revenue: Number(revenue || 0) }
}

export function listCoursePurchases({ courseId = null, limit = 50 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 50))
  const rows = courseId
    ? db
        .prepare(
          `SELECT p.*, c.title AS course_title, c.slug AS course_slug,
                  m.username, m.display_name
           FROM kb_purchases p
           JOIN kb_courses c ON c.id = p.course_id
           JOIN community_members m ON m.id = p.member_id
           WHERE p.course_id = ?
           ORDER BY p.id DESC LIMIT ?`,
        )
        .all(courseId, lim)
    : db
        .prepare(
          `SELECT p.*, c.title AS course_title, c.slug AS course_slug,
                  m.username, m.display_name
           FROM kb_purchases p
           JOIN kb_courses c ON c.id = p.course_id
           JOIN community_members m ON m.id = p.member_id
           ORDER BY p.id DESC LIMIT ?`,
        )
        .all(lim)
  return rows.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    courseTitle: r.course_title,
    courseSlug: r.course_slug,
    memberId: r.member_id,
    username: r.username,
    displayName: r.display_name || r.username,
    pointsSpent: Number(r.points_spent || 0),
    createdAt: r.created_at,
  }))
}

export function seedCoursesIfEmpty() {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM kb_courses`).get().c
  if (count > 0) return

  const video = createCourse({
    title: '前端工程化入门',
    subtitle: '用积分解锁的视频课',
    type: 'video',
    pricePoints: 20,
    summary: '从 Vite 到组件化，快速建立前端工程化心智模型。',
    introMd: '本课程适合社区新人。购买后可观看全部视频课时。\n\n**用任务积分兑换**，持续学习。',
    bodyMd: '感谢购买！完整讲义与作业请在各课时内查看。',
    coverUrl: '',
    status: 'published',
    sort: 1,
    lessons: [
      {
        title: '导学：为什么要工程化',
        contentType: 'video',
        mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        bodyMd: '免费试看：了解本课目标与学习路径。',
        durationMinutes: 3,
        isFree: true,
        sort: 0,
      },
      {
        title: 'Vite 项目起步',
        contentType: 'video',
        mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        bodyMd: '安装、脚本、目录约定与热更新原理简述。',
        durationMinutes: 8,
        sort: 1,
      },
      {
        title: '组件与样式约定',
        contentType: 'video',
        mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        bodyMd: 'Tailwind + 组件边界，如何保持可维护。',
        durationMinutes: 10,
        sort: 2,
      },
    ],
  })

  createCourse({
    title: '社区写作方法论',
    subtitle: '文章课 · 把想法写成博客',
    type: 'article',
    pricePoints: 15,
    summary: '结构化写作、标题炼金与博客发布流程。',
    introMd: '适合想在博客频道持续输出的同学。试读第一节免费开放。',
    bodyMd: '全文附录与模板见各课时。',
    status: 'published',
    sort: 2,
    lessons: [
      {
        title: '选题与读者画像',
        contentType: 'article',
        bodyMd:
          '## 免费试读\n\n先回答三个问题：写给谁？解决什么？读完能带走什么？\n\n- 新手\n- 同好\n- 决策者\n',
        isFree: true,
        sort: 0,
      },
      {
        title: '结构：从大纲到完稿',
        contentType: 'article',
        bodyMd:
          '## 结构模板\n\n1. 场景痛点\n2. 方案步骤\n3. 反例与坑\n4. 总结清单\n\n写完后用博客频道发布，再去论坛开帖讨论。',
        sort: 1,
      },
      {
        title: '发布与反馈闭环',
        contentType: 'article',
        bodyMd: '发布后收集评论，把高频问题沉淀成下一篇博客。积分可继续兑换进阶课。',
        sort: 2,
      },
    ],
  })

  // free course
  createCourse({
    title: '积分与任务玩法说明',
    subtitle: '免费入门',
    type: 'article',
    pricePoints: 0,
    summary: '了解如何做任务赚积分、如何兑换课程。',
    introMd: '本课免费，帮助你快速上手社区成长路径。',
    bodyMd: '任务中心完成任务 → 获得积分 → 课程商城兑换。',
    status: 'published',
    sort: 0,
    lessons: [
      {
        title: '完整说明',
        contentType: 'article',
        bodyMd:
          '## 成长路径\n\n1. 做任务赚积分\n2. 写博客 / 论坛互动\n3. 在课程商城兑换知识内容\n',
        isFree: true,
        sort: 0,
      },
    ],
  })

  void video
}
