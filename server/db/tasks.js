import { db } from './sqlite.js'
import { findMemberById } from './members.js'

export const TASK_TYPES = ['read', 'video', 'audio', 'quiz', 'post']

const TYPE_LABELS = {
  read: '阅读文章',
  video: '观看视频',
  audio: '收听音频',
  quiz: '答题测验',
  post: '论坛发帖',
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function parseJson(raw, fallback = {}) {
  if (raw == null || raw === '') return fallback
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function mapTask(row, progress = null) {
  if (!row) return null
  const config = parseJson(row.config_json, {})
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    type: row.type,
    typeLabel: TYPE_LABELS[row.type] || row.type,
    rewardPoints: Number(row.reward_points || 0),
    config,
    status: row.status,
    sort: Number(row.sort || 0),
    repeatable: !!row.repeatable,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progress: progress
      ? {
          status: progress.status,
          progress: parseJson(progress.progress_json, {}),
          score: progress.score != null ? Number(progress.score) : null,
          completedAt: progress.completed_at,
          startedAt: progress.started_at,
          rewardGranted: !!progress.reward_granted,
        }
      : null,
  }
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
  let slug = desired || `task-${Date.now()}`
  let n = 2
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM community_tasks WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM community_tasks WHERE slug = ?`).get(slug)
    if (!row) return slug
    slug = `${desired}-${n++}`
  }
}

export function findTaskById(id) {
  const row = db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(id)
  return row ? mapTask(row) : null
}

export function findTaskBySlug(slug) {
  const row = db.prepare(`SELECT * FROM community_tasks WHERE slug = ?`).get(slug)
  return row ? mapTask(row) : null
}

export function listTasks({ status = 'active', type = '', q = '', includeDrafts = false } = {}) {
  const where = []
  const params = []
  if (!includeDrafts) {
    where.push(`status = 'active'`)
  } else if (status) {
    where.push(`status = ?`)
    params.push(status)
  }
  if (type) {
    where.push(`type = ?`)
    params.push(type)
  }
  if (q) {
    where.push(`(title LIKE ? OR description LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return db
    .prepare(
      `SELECT * FROM community_tasks ${whereSql}
       ORDER BY sort ASC, id DESC`,
    )
    .all(...params)
    .map((r) => mapTask(r))
}

export function listTasksForMember(memberId, { type = '' } = {}) {
  const tasks = listTasks({ type })
  const progStmt = db.prepare(
    `SELECT * FROM community_task_progress
     WHERE member_id = ? AND task_id = ?
     ORDER BY id DESC LIMIT 1`,
  )
  return tasks.map((t) => {
    const p = progStmt.get(memberId, t.id)
    return mapTask(
      db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(t.id),
      p,
    )
  })
}

export function createTask(data) {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('标题必填')
  const type = String(data.type || '').trim()
  if (!TASK_TYPES.includes(type)) throw new Error('无效任务类型')
  const reward = Math.max(0, Number(data.rewardPoints ?? data.reward_points ?? 0))
  const slug = uniqueSlug(slugify(data.slug || title))
  const now = nowStr()
  const config = data.config && typeof data.config === 'object' ? data.config : {}
  const info = db
    .prepare(
      `INSERT INTO community_tasks
        (slug, title, description, type, reward_points, config_json, status, sort, repeatable, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      title,
      String(data.description || ''),
      type,
      reward,
      JSON.stringify(config),
      data.status === 'draft' || data.status === 'archived' ? data.status : 'active',
      Number(data.sort || 0),
      data.repeatable ? 1 : 0,
      data.startsAt || null,
      data.endsAt || null,
      now,
      now,
    )
  return findTaskById(info.lastInsertRowid)
}

export function updateTask(id, data) {
  const existing = db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(id)
  if (!existing) return null
  const title = data.title != null ? String(data.title).trim() : existing.title
  const type = data.type != null ? String(data.type).trim() : existing.type
  if (!TASK_TYPES.includes(type)) throw new Error('无效任务类型')
  const reward =
    data.rewardPoints != null || data.reward_points != null
      ? Math.max(0, Number(data.rewardPoints ?? data.reward_points))
      : existing.reward_points
  let slug = existing.slug
  if (data.slug != null) slug = uniqueSlug(slugify(data.slug) || existing.slug, Number(id))
  const config =
    data.config != null
      ? typeof data.config === 'object'
        ? data.config
        : parseJson(data.config, {})
      : parseJson(existing.config_json, {})
  const status = data.status != null ? data.status : existing.status
  if (!['draft', 'active', 'archived'].includes(status)) throw new Error('无效状态')
  const now = nowStr()
  db.prepare(
    `UPDATE community_tasks SET
      slug=?, title=?, description=?, type=?, reward_points=?, config_json=?,
      status=?, sort=?, repeatable=?, starts_at=?, ends_at=?, updated_at=?
     WHERE id=?`,
  ).run(
    slug,
    title,
    data.description != null ? String(data.description) : existing.description,
    type,
    reward,
    JSON.stringify(config),
    status,
    data.sort != null ? Number(data.sort) : existing.sort,
    data.repeatable != null ? (data.repeatable ? 1 : 0) : existing.repeatable,
    data.startsAt !== undefined ? data.startsAt || null : existing.starts_at,
    data.endsAt !== undefined ? data.endsAt || null : existing.ends_at,
    now,
    id,
  )
  return findTaskById(id)
}

export function deleteTask(id) {
  const info = db.prepare(`DELETE FROM community_tasks WHERE id = ?`).run(id)
  return info.changes > 0
}

function getLatestProgress(taskId, memberId) {
  return db
    .prepare(
      `SELECT * FROM community_task_progress
       WHERE task_id = ? AND member_id = ?
       ORDER BY id DESC LIMIT 1`,
    )
    .get(taskId, memberId)
}

function assertTaskOpen(task) {
  if (!task || task.status !== 'active') throw new Error('任务未开放')
  const now = Date.now()
  if (task.startsAt) {
    const t = new Date(String(task.startsAt).replace(' ', 'T')).getTime()
    if (!Number.isNaN(t) && now < t) throw new Error('任务尚未开始')
  }
  if (task.endsAt) {
    const t = new Date(String(task.endsAt).replace(' ', 'T')).getTime()
    if (!Number.isNaN(t) && now > t) throw new Error('任务已结束')
  }
}

export function startTask(taskId, memberId) {
  const task = findTaskById(taskId)
  assertTaskOpen(task)
  const existing = getLatestProgress(taskId, memberId)
  if (existing?.status === 'completed' && !task.repeatable) {
    throw new Error('任务已完成')
  }
  if (existing?.status === 'in_progress') {
    return mapTask(db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(taskId), existing)
  }
  const now = nowStr()
  const info = db
    .prepare(
      `INSERT INTO community_task_progress
        (task_id, member_id, status, progress_json, started_at, updated_at)
       VALUES (?, ?, 'in_progress', '{}', ?, ?)`,
    )
    .run(taskId, memberId, now, now)
  const progress = db.prepare(`SELECT * FROM community_task_progress WHERE id = ?`).get(info.lastInsertRowid)
  return mapTask(db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(taskId), progress)
}

export function updateTaskProgress(taskId, memberId, patch = {}) {
  const task = findTaskById(taskId)
  assertTaskOpen(task)
  let progress = getLatestProgress(taskId, memberId)
  if (!progress || progress.status === 'completed') {
    if (progress?.status === 'completed' && !task.repeatable) throw new Error('任务已完成')
    startTask(taskId, memberId)
    progress = getLatestProgress(taskId, memberId)
  }
  const cur = parseJson(progress.progress_json, {})
  const next = { ...cur, ...patch }
  // clamp media progress
  if (typeof next.percent === 'number') {
    next.percent = Math.max(0, Math.min(100, Number(next.percent)))
  }
  if (typeof next.seconds === 'number') {
    next.seconds = Math.max(0, Number(next.seconds))
  }
  const now = nowStr()
  db.prepare(
    `UPDATE community_task_progress SET progress_json = ?, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify(next), now, progress.id)
  const fresh = db.prepare(`SELECT * FROM community_task_progress WHERE id = ?`).get(progress.id)
  return mapTask(db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(taskId), fresh)
}

function validateCompletion(task, progressRow, memberId, payload = {}) {
  const config = task.config || {}
  const prog = parseJson(progressRow.progress_json, {})

  if (task.type === 'read') {
    const minSeconds = Number(config.minSeconds || 20)
    const seconds = Number(payload.seconds ?? prog.seconds ?? 0)
    if (seconds < minSeconds) throw new Error(`请至少阅读 ${minSeconds} 秒`)
    return { score: null, progress: { ...prog, seconds, confirmed: true } }
  }

  if (task.type === 'video' || task.type === 'audio') {
    const minPercent = Number(config.minPercent || 80)
    const percent = Number(payload.percent ?? prog.percent ?? 0)
    if (percent < minPercent) {
      throw new Error(`进度需达到 ${minPercent}%（当前 ${Math.floor(percent)}%）`)
    }
    return { score: null, progress: { ...prog, percent } }
  }

  if (task.type === 'quiz') {
    const questions = Array.isArray(config.questions) ? config.questions : []
    if (!questions.length) throw new Error('测验未配置题目')
    const answers = payload.answers || prog.answers || {}
    let correct = 0
    for (const q of questions) {
      const key = String(q.id)
      if (Number(answers[key]) === Number(q.answer)) correct += 1
    }
    const score = Math.round((correct / questions.length) * 100)
    const passScore = Number(config.passScore || 60)
    if (score < passScore) throw new Error(`未达标：得分 ${score}，需 ≥ ${passScore}`)
    return { score, progress: { ...prog, answers, correct, total: questions.length } }
  }

  if (task.type === 'post') {
    const startedAt = progressRow.started_at
    const minTitle = Number(config.minTitleLen || 4)
    const minBody = Number(config.minBodyLen || 10)
    const params = [memberId, startedAt]
    let sql = `SELECT id, title, body_md, category_id FROM forum_topics
               WHERE author_id = ? AND created_at >= ?`
    if (config.categoryId) {
      sql += ` AND category_id = ?`
      params.push(Number(config.categoryId))
    } else if (config.categorySlug) {
      sql += ` AND category_id = (SELECT id FROM forum_categories WHERE slug = ?)`
      params.push(config.categorySlug)
    }
    sql += ` ORDER BY id DESC LIMIT 5`
    const topics = db.prepare(sql).all(...params)
    const ok = topics.find(
      (t) =>
        String(t.title || '').trim().length >= minTitle &&
        String(t.body_md || '').trim().length >= minBody,
    )
    if (!ok) {
      throw new Error('请先发表符合要求的帖子后再提交任务')
    }
    return { score: null, progress: { ...prog, topicId: ok.id } }
  }

  throw new Error('未知任务类型')
}

function grantTaskPoints(memberId, task, progressId) {
  const delta = Number(task.rewardPoints || 0)
  if (delta <= 0) return findMemberById(memberId)
  const now = nowStr()
  const tx = db.transaction(() => {
    db.prepare(`UPDATE community_members SET points = points + ?, updated_at = ? WHERE id = ?`).run(
      delta,
      now,
      memberId,
    )
    db.prepare(
      `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, ref_id, created_at)
       VALUES (?, ?, ?, 'task', ?, ?)`,
    ).run(memberId, delta, `完成任务：${task.title}`, progressId, now)
    db.prepare(
      `UPDATE community_task_progress SET reward_granted = 1, updated_at = ? WHERE id = ?`,
    ).run(now, progressId)
  })
  tx()
  return findMemberById(memberId)
}

export function completeTask(taskId, memberId, payload = {}) {
  const task = findTaskById(taskId)
  assertTaskOpen(task)
  let progress = getLatestProgress(taskId, memberId)
  if (!progress) {
    startTask(taskId, memberId)
    progress = getLatestProgress(taskId, memberId)
  }
  if (progress.status === 'completed' && progress.reward_granted && !task.repeatable) {
    throw new Error('任务已完成，积分已发放')
  }

  const { score, progress: nextProg } = validateCompletion(task, progress, memberId, payload)
  const now = nowStr()
  db.prepare(
    `UPDATE community_task_progress SET
      status = 'completed', progress_json = ?, score = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(JSON.stringify(nextProg), score, now, now, progress.id)

  let member = findMemberById(memberId)
  if (!progress.reward_granted) {
    member = grantTaskPoints(memberId, task, progress.id)
  }

  const fresh = db.prepare(`SELECT * FROM community_task_progress WHERE id = ?`).get(progress.id)
  return {
    task: mapTask(db.prepare(`SELECT * FROM community_tasks WHERE id = ?`).get(taskId), fresh),
    member: member
      ? { id: member.id, points: member.points, displayName: member.displayName, username: member.username }
      : null,
    earned: Number(task.rewardPoints || 0),
  }
}

export function taskStats() {
  const total = db.prepare(`SELECT COUNT(*) AS c FROM community_tasks`).get().c
  const active = db.prepare(`SELECT COUNT(*) AS c FROM community_tasks WHERE status = 'active'`).get().c
  const completions = db
    .prepare(`SELECT COUNT(*) AS c FROM community_task_progress WHERE status = 'completed'`)
    .get().c
  const byType = db
    .prepare(
      `SELECT type, COUNT(*) AS c FROM community_tasks GROUP BY type`,
    )
    .all()
    .reduce((acc, r) => {
      acc[r.type] = r.c
      return acc
    }, {})
  return { total, active, completions, byType }
}

export function listTaskCompletions({ taskId = null, limit = 50 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 50))
  const rows = taskId
    ? db
        .prepare(
          `SELECT p.*, t.title AS task_title, t.type AS task_type, t.reward_points,
                  m.username, m.display_name
           FROM community_task_progress p
           JOIN community_tasks t ON t.id = p.task_id
           JOIN community_members m ON m.id = p.member_id
           WHERE p.task_id = ? AND p.status = 'completed'
           ORDER BY p.id DESC LIMIT ?`,
        )
        .all(taskId, lim)
    : db
        .prepare(
          `SELECT p.*, t.title AS task_title, t.type AS task_type, t.reward_points,
                  m.username, m.display_name
           FROM community_task_progress p
           JOIN community_tasks t ON t.id = p.task_id
           JOIN community_members m ON m.id = p.member_id
           WHERE p.status = 'completed'
           ORDER BY p.id DESC LIMIT ?`,
        )
        .all(lim)
  return rows.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.task_title,
    taskType: r.task_type,
    memberId: r.member_id,
    username: r.username,
    displayName: r.display_name || r.username,
    rewardPoints: Number(r.reward_points || 0),
    rewardGranted: !!r.reward_granted,
    score: r.score,
    completedAt: r.completed_at || r.updated_at,
  }))
}

export function seedTasksIfEmpty() {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM community_tasks`).get().c
  if (count > 0) return

  const blog = db
    .prepare(`SELECT slug FROM blog_posts WHERE status = 'published' ORDER BY id ASC LIMIT 1`)
    .get()
  const cat = db.prepare(`SELECT slug FROM forum_categories ORDER BY sort ASC LIMIT 1`).get()

  const samples = [
    {
      title: '阅读社区精选文章',
      description: '打开指定博客文章，认真阅读至少 30 秒后提交，即可获得任务积分。',
      type: 'read',
      rewardPoints: 5,
      config: {
        url: blog ? `/pages/blog-post.html?slug=${encodeURIComponent(blog.slug)}` : '/pages/blog.html',
        minSeconds: 30,
        blogSlug: blog?.slug || '',
      },
      sort: 1,
    },
    {
      title: '观看入门介绍视频',
      description: '观看介绍视频至 80% 进度后提交。',
      type: 'video',
      rewardPoints: 8,
      config: {
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        minPercent: 80,
        poster: '',
      },
      sort: 2,
    },
    {
      title: '收听社区播客片段',
      description: '收听音频至 80% 进度后提交。',
      type: 'audio',
      rewardPoints: 6,
      config: {
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
        minPercent: 80,
      },
      sort: 3,
    },
    {
      title: '社区入门小测验',
      description: '答对 60% 以上即可通关。',
      type: 'quiz',
      rewardPoints: 10,
      config: {
        passScore: 60,
        questions: [
          {
            id: 'q1',
            prompt: '发表长文应选择哪个频道？',
            options: ['博客', '论坛', '私信', '后台'],
            answer: 0,
          },
          {
            id: 'q2',
            prompt: '论坛发帖属于？',
            options: ['写博客', '发帖', '发表评论', '发表私信'],
            answer: 1,
          },
          {
            id: 'q3',
            prompt: '完成任务可以获得？',
            options: ['现金', '任务积分', '管理员权限', '数据库'],
            answer: 1,
          },
        ],
      },
      sort: 4,
    },
    {
      title: '分享你的第一个帖子',
      description: '在论坛发表一篇帖子（标题≥4字，正文≥10字），回来提交任务领取积分。',
      type: 'post',
      rewardPoints: 12,
      config: {
        categorySlug: cat?.slug || '',
        minTitleLen: 4,
        minBodyLen: 10,
        tip: '先去「发帖」，完成后再回到本页提交。',
      },
      sort: 5,
    },
  ]

  for (const s of samples) {
    createTask({ ...s, status: 'active' })
  }
}
