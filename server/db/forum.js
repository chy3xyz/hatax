import { db } from './sqlite.js'
import { mdToHtml } from '../lib/markdown.js'

function mapCategory(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    color: row.color || '#1890ff',
    sort: row.sort || 0,
    topicCount: row.topic_count || 0,
    createdAt: row.created_at,
  }
}

function mapTopic(row, tags = []) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.category_slug || '',
    categoryName: row.category_name || '',
    categoryColor: row.category_color || '#1890ff',
    title: row.title,
    bodyMd: row.body_md || '',
    bodyHtml: mdToHtml(row.body_md || ''),
    authorId: row.author_id,
    authorName: row.author_name || '',
    pinned: !!row.pinned,
    locked: !!row.locked,
    replyCount: row.reply_count || 0,
    likeCount: row.like_count || 0,
    viewCount: row.view_count || 0,
    lastReplyAt: row.last_reply_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
  }
}

function mapTag(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color || '#64748b',
    description: row.description || '',
    topicCount: Number(row.topic_count || 0),
    createdAt: row.created_at,
  }
}

function tagsForTopic(topicId) {
  return db
    .prepare(
      `SELECT t.id, t.slug, t.name, t.color, t.description
       FROM forum_tags t
       JOIN forum_topic_tags tt ON tt.tag_id = t.id
       WHERE tt.topic_id = ?
       ORDER BY t.name`,
    )
    .all(topicId)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      color: r.color || '#64748b',
      description: r.description || '',
    }))
}

function tagsForTopics(topicIds) {
  const map = new Map()
  if (!topicIds.length) return map
  const placeholders = topicIds.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT tt.topic_id AS topicId, t.id, t.slug, t.name, t.color
       FROM forum_topic_tags tt
       JOIN forum_tags t ON t.id = tt.tag_id
       WHERE tt.topic_id IN (${placeholders})
       ORDER BY t.name`,
    )
    .all(...topicIds)
  for (const r of rows) {
    if (!map.has(r.topicId)) map.set(r.topicId, [])
    map.get(r.topicId).push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      color: r.color || '#64748b',
    })
  }
  return map
}

function slugifyTag(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function listForumTags() {
  return db
    .prepare(
      `SELECT t.*, COUNT(tt.topic_id) AS topic_count
       FROM forum_tags t
       LEFT JOIN forum_topic_tags tt ON tt.tag_id = t.id
       GROUP BY t.id
       ORDER BY topic_count DESC, t.name ASC`,
    )
    .all()
    .map(mapTag)
}

export function syncTopicTags(topicId, tagInputs = []) {
  db.prepare(`DELETE FROM forum_topic_tags WHERE topic_id = ?`).run(topicId)
  const raw = Array.isArray(tagInputs) ? tagInputs : String(tagInputs || '').split(',')
  const slugs = [
    ...new Set(
      raw
        .map((x) => slugifyTag(typeof x === 'string' ? x : x?.slug || x?.name || ''))
        .filter(Boolean),
    ),
  ].slice(0, 5)

  const findTag = db.prepare(`SELECT id FROM forum_tags WHERE slug = ?`)
  const insertTag = db.prepare(
    `INSERT INTO forum_tags (slug, name, color) VALUES (?, ?, ?)`,
  )
  const link = db.prepare(`INSERT OR IGNORE INTO forum_topic_tags (topic_id, tag_id) VALUES (?, ?)`)
  const colors = ['#fa8c16', '#646cff', '#77c1d2', '#52c41a', '#722ed1', '#eb2f96', '#1890ff']

  for (const slug of slugs) {
    let row = findTag.get(slug)
    if (!row) {
      const name = slug.replace(/-/g, ' ')
      const color = colors[Math.abs(slug.length * 13) % colors.length]
      const info = insertTag.run(slug, name, color)
      row = { id: info.lastInsertRowid }
    }
    link.run(topicId, row.id)
  }
  return tagsForTopic(topicId)
}

function mapPost(row, floor = null) {
  return {
    id: row.id,
    topicId: row.topic_id,
    bodyMd: row.body_md || '',
    bodyHtml: mdToHtml(row.body_md || ''),
    authorId: row.author_id,
    authorName: row.author_name || '',
    likeCount: row.like_count || 0,
    floor: floor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listCategories() {
  return db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM forum_topics t WHERE t.category_id = c.id) AS topic_count
       FROM forum_categories c
       ORDER BY c.sort ASC, c.id ASC`,
    )
    .all()
    .map(mapCategory)
}

export function findCategoryById(id) {
  const row = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM forum_topics t WHERE t.category_id = c.id) AS topic_count
       FROM forum_categories c WHERE c.id = ?`,
    )
    .get(id)
  return row ? mapCategory(row) : null
}

export function createCategory(data) {
  const name = String(data.name || '').trim()
  if (!name) throw new Error('分区名称必填')
  const slug =
    String(data.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '') || slugifyTag(name)
  if (!slug) throw new Error('分区 slug 无效')
  const color = String(data.color || '#1890ff')
  const description = String(data.description || '')
  const sort = Number(data.sort || 0)
  try {
    const info = db
      .prepare(
        `INSERT INTO forum_categories (slug, name, description, color, sort) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(slug, name, description, color, sort)
    return findCategoryById(info.lastInsertRowid)
  } catch {
    throw new Error('分区 slug 已存在')
  }
}

export function updateCategory(id, data) {
  const existing = findCategoryById(id)
  if (!existing) return null
  const name = data.name != null ? String(data.name).trim() : existing.name
  const description = data.description != null ? String(data.description) : existing.description
  const color = data.color != null ? String(data.color) : existing.color
  const sort = data.sort != null ? Number(data.sort) : existing.sort
  let slug = existing.slug
  if (data.slug != null) {
    slug = String(data.slug)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    if (!slug) throw new Error('分区 slug 无效')
  }
  try {
    db.prepare(
      `UPDATE forum_categories SET slug = ?, name = ?, description = ?, color = ?, sort = ? WHERE id = ?`,
    ).run(slug, name, description, color, sort, id)
  } catch {
    throw new Error('分区 slug 冲突')
  }
  return findCategoryById(id)
}

export function deleteCategory(id) {
  const existing = findCategoryById(id)
  if (!existing) return false
  const count = db.prepare(`SELECT COUNT(*) AS c FROM forum_topics WHERE category_id = ?`).get(id).c
  if (count > 0) throw new Error('分区下仍有帖子，无法删除')
  db.prepare(`DELETE FROM forum_categories WHERE id = ?`).run(id)
  return true
}

export function createForumTag(data) {
  const name = String(data.name || '').trim()
  if (!name) throw new Error('标签名称必填')
  const slug = slugifyTag(data.slug || name)
  if (!slug) throw new Error('标签 slug 无效')
  const color = String(data.color || '#64748b')
  const description = String(data.description || '')
  try {
    const info = db
      .prepare(`INSERT INTO forum_tags (slug, name, color, description) VALUES (?, ?, ?, ?)`)
      .run(slug, name, color, description)
    return listForumTags().find((t) => t.id === Number(info.lastInsertRowid))
  } catch {
    throw new Error('标签已存在')
  }
}

export function updateForumTag(id, data) {
  const row = db.prepare(`SELECT * FROM forum_tags WHERE id = ?`).get(id)
  if (!row) return null
  const name = data.name != null ? String(data.name).trim() : row.name
  const color = data.color != null ? String(data.color) : row.color
  const description = data.description != null ? String(data.description) : row.description || ''
  let slug = row.slug
  if (data.slug != null) {
    slug = slugifyTag(data.slug)
    if (!slug) throw new Error('标签 slug 无效')
  }
  try {
    db.prepare(
      `UPDATE forum_tags SET slug = ?, name = ?, color = ?, description = ? WHERE id = ?`,
    ).run(slug, name, color, description, id)
  } catch {
    throw new Error('标签 slug 冲突')
  }
  return listForumTags().find((t) => t.id === Number(id))
}

export function deleteForumTag(id) {
  db.prepare(`DELETE FROM forum_topic_tags WHERE tag_id = ?`).run(id)
  const info = db.prepare(`DELETE FROM forum_tags WHERE id = ?`).run(id)
  return info.changes > 0
}

export function deleteReply(id) {
  const post = findPostById(id)
  if (!post) return false
  db.prepare(`DELETE FROM forum_posts WHERE id = ?`).run(id)
  db.prepare(`DELETE FROM forum_likes WHERE target_type = 'post' AND target_id = ?`).run(id)
  db.prepare(
    `UPDATE forum_topics SET
       reply_count = CASE WHEN reply_count > 0 THEN reply_count - 1 ELSE 0 END,
       updated_at = ?
     WHERE id = ?`,
  ).run(new Date().toISOString().slice(0, 19).replace('T', ' '), post.topicId)
  return true
}

export function findCategoryBySlug(slug) {
  const row = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM forum_topics t WHERE t.category_id = c.id) AS topic_count
       FROM forum_categories c WHERE c.slug = ?`,
    )
    .get(slug)
  return row ? mapCategory(row) : null
}

export function listTopics({ category = '', q = '', tag = '', page = 1, pageSize = 20, sort = 'latest' } = {}) {
  const where = []
  const params = []
  if (category) {
    where.push(`(c.slug = ? OR c.id = ?)`)
    params.push(category, Number(category) || -1)
  }
  if (q) {
    where.push(`(t.title LIKE ? OR t.body_md LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like)
  }
  if (tag) {
    where.push(
      `EXISTS (
         SELECT 1 FROM forum_topic_tags tt
         JOIN forum_tags tg ON tg.id = tt.tag_id
         WHERE tt.topic_id = t.id AND (tg.slug = ? OR tg.name = ?)
       )`,
    )
    params.push(tag, tag)
  }
  if (sort === 'unanswered') {
    where.push(`t.reply_count = 0`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db
    .prepare(
      `SELECT COUNT(*) AS c FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       ${whereSql}`,
    )
    .get(...params).c

  let orderSql =
    `ORDER BY t.pinned DESC, COALESCE(t.last_reply_at, t.created_at) DESC`
  if (sort === 'hot') {
    orderSql = `ORDER BY t.pinned DESC,
      (t.reply_count * 3 + t.like_count * 2 + t.view_count) DESC,
      COALESCE(t.last_reply_at, t.created_at) DESC`
  } else if (sort === 'unanswered') {
    orderSql = `ORDER BY t.pinned DESC, t.created_at DESC`
  }

  const offset = (Math.max(1, page) - 1) * pageSize
  const rows = db
    .prepare(
      `SELECT t.*, c.slug AS category_slug, c.name AS category_name, c.color AS category_color
       FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset)

  const tagMap = tagsForTopics(rows.map((r) => r.id))
  return {
    total,
    page: Math.max(1, page),
    pageSize,
    rows: rows.map((r) => mapTopic(r, tagMap.get(r.id) || [])),
  }
}

export function findTopicById(id) {
  const row = db
    .prepare(
      `SELECT t.*, c.slug AS category_slug, c.name AS category_name, c.color AS category_color
       FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       WHERE t.id = ?`,
    )
    .get(id)
  return row ? mapTopic(row, tagsForTopic(id)) : null
}

export function listReplies(topicId) {
  return db
    .prepare(`SELECT * FROM forum_posts WHERE topic_id = ? ORDER BY created_at ASC, id ASC`)
    .all(topicId)
    .map((row, i) => mapPost(row, i + 1))
}

export function findPostById(id) {
  const row = db.prepare(`SELECT * FROM forum_posts WHERE id = ?`).get(id)
  return row ? mapPost(row) : null
}

export function listTopicsByAuthor(authorId, { limit = 20 } = {}) {
  const rows = db
    .prepare(
      `SELECT t.*, c.slug AS category_slug, c.name AS category_name, c.color AS category_color
       FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       WHERE t.author_id = ?
       ORDER BY COALESCE(t.last_reply_at, t.created_at) DESC
       LIMIT ?`,
    )
    .all(authorId, Math.min(Number(limit) || 20, 50))

  const tagMap = tagsForTopics(rows.map((r) => r.id))
  return rows.map((r) => mapTopic(r, tagMap.get(r.id) || []))
}

export function listRepliesByAuthor(authorId, { limit = 20 } = {}) {
  return db
    .prepare(
      `SELECT p.*, t.title AS topic_title, t.id AS topic_id_ref
       FROM forum_posts p
       JOIN forum_topics t ON t.id = p.topic_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT ?`,
    )
    .all(authorId, Math.min(Number(limit) || 20, 50))
    .map((row) => ({
      ...mapPost(row),
      topicId: row.topic_id,
      topicTitle: row.topic_title || '',
    }))
}

export function forumStats() {
  const categories = db.prepare(`SELECT COUNT(*) AS c FROM forum_categories`).get().c
  const topics = db.prepare(`SELECT COUNT(*) AS c FROM forum_topics`).get().c
  const replies = db.prepare(`SELECT COUNT(*) AS c FROM forum_posts`).get().c
  const members = db.prepare(`SELECT COUNT(*) AS c FROM community_members`).get().c
  const unanswered = db.prepare(`SELECT COUNT(*) AS c FROM forum_topics WHERE reply_count = 0`).get().c
  const latest = db
    .prepare(
      `SELECT t.id, t.title, t.last_reply_at, t.created_at, t.author_name, t.author_id,
              t.reply_count, c.name AS category_name, c.color AS category_color
       FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       ORDER BY COALESCE(t.last_reply_at, t.created_at) DESC
       LIMIT 6`,
    )
    .all()
  const hot = db
    .prepare(
      `SELECT t.id, t.title, t.reply_count, t.like_count, t.view_count, t.author_name,
              c.name AS category_name, c.color AS category_color
       FROM forum_topics t
       JOIN forum_categories c ON c.id = t.category_id
       ORDER BY (t.reply_count * 3 + t.like_count * 2 + t.view_count) DESC
       LIMIT 5`,
    )
    .all()
  return { categories, topics, replies, members, unanswered, latest, hot }
}

export function bumpTopicView(id) {
  db.prepare(`UPDATE forum_topics SET view_count = view_count + 1 WHERE id = ?`).run(id)
}

export function createTopic(data, actor) {
  const title = String(data.title || '').trim()
  const body = String(data.bodyMd || data.body || '').trim()
  const categoryId = Number(data.categoryId)
  if (!title || !body) throw new Error('标题与内容必填')
  if (!categoryId) throw new Error('请选择分区')
  const cat = db.prepare(`SELECT id FROM forum_categories WHERE id = ?`).get(categoryId)
  if (!cat) throw new Error('分区不存在')

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const info = db
    .prepare(
      `INSERT INTO forum_topics
        (category_id, title, body_md, author_id, author_name, last_reply_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      categoryId,
      title,
      body,
      actor?.sub != null ? Number(actor.sub) : null,
      actor?.displayName || actor?.username || '匿名',
      now,
      now,
      now,
    )

  db.prepare(`UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = ?`).run(categoryId)
  const topicId = info.lastInsertRowid
  if (data.tags != null) syncTopicTags(topicId, data.tags)
  return findTopicById(topicId)
}

export function createReply(topicId, data, actor) {
  const topic = findTopicById(topicId)
  if (!topic) return null
  if (topic.locked) throw new Error('主题已锁定')
  const body = String(data.bodyMd || data.body || '').trim()
  if (!body) throw new Error('回复内容不能为空')

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const info = db
    .prepare(
      `INSERT INTO forum_posts (topic_id, body_md, author_id, author_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      topicId,
      body,
      actor?.sub != null ? Number(actor.sub) : null,
      actor?.displayName || actor?.username || '匿名',
      now,
      now,
    )

  db.prepare(
    `UPDATE forum_topics SET reply_count = reply_count + 1, last_reply_at = ?, updated_at = ? WHERE id = ?`,
  ).run(now, now, topicId)

  return mapPost(db.prepare(`SELECT * FROM forum_posts WHERE id = ?`).get(info.lastInsertRowid))
}

export function updateTopic(id, data) {
  const topic = findTopicById(id)
  if (!topic) return null
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const title = data.title != null ? String(data.title).trim() : topic.title
  const body = data.bodyMd != null || data.body != null ? String(data.bodyMd || data.body || '') : topic.bodyMd
  const pinned = data.pinned != null ? (data.pinned ? 1 : 0) : topic.pinned ? 1 : 0
  const locked = data.locked != null ? (data.locked ? 1 : 0) : topic.locked ? 1 : 0
  let categoryId = topic.categoryId
  if (data.categoryId != null) {
    const cat = findCategoryById(Number(data.categoryId))
    if (!cat) throw new Error('分区不存在')
    categoryId = cat.id
  }

  db.prepare(
    `UPDATE forum_topics SET category_id = ?, title = ?, body_md = ?, pinned = ?, locked = ?, updated_at = ? WHERE id = ?`,
  ).run(categoryId, title, body, pinned, locked, now, id)

  if (categoryId !== topic.categoryId) {
    db.prepare(
      `UPDATE forum_categories SET topic_count = CASE WHEN topic_count > 0 THEN topic_count - 1 ELSE 0 END WHERE id = ?`,
    ).run(topic.categoryId)
    db.prepare(`UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = ?`).run(categoryId)
  }

  if (data.tags != null) syncTopicTags(id, data.tags)
  return findTopicById(id)
}

export function deleteTopic(id) {
  const topic = findTopicById(id)
  if (!topic) return false
  db.prepare(`DELETE FROM forum_topics WHERE id = ?`).run(id)
  db.prepare(
    `UPDATE forum_categories SET topic_count = CASE WHEN topic_count > 0 THEN topic_count - 1 ELSE 0 END WHERE id = ?`,
  ).run(topic.categoryId)
  return true
}

export function toggleLike(userId, targetType, targetId) {
  if (!['topic', 'post'].includes(targetType)) throw new Error('无效目标')
  const existing = db
    .prepare(
      `SELECT id FROM forum_likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    )
    .get(userId, targetType, targetId)

  const table = targetType === 'topic' ? 'forum_topics' : 'forum_posts'
  if (existing) {
    db.prepare(`DELETE FROM forum_likes WHERE id = ?`).run(existing.id)
    db.prepare(
      `UPDATE ${table} SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?`,
    ).run(targetId)
    return { liked: false }
  }
  db.prepare(
    `INSERT INTO forum_likes (user_id, target_type, target_id) VALUES (?, ?, ?)`,
  ).run(userId, targetType, targetId)
  db.prepare(`UPDATE ${table} SET like_count = like_count + 1 WHERE id = ?`).run(targetId)
  return { liked: true }
}

export function userLiked(userId, targetType, targetId) {
  if (!userId) return false
  return !!db
    .prepare(
      `SELECT id FROM forum_likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    )
    .get(userId, targetType, targetId)
}
