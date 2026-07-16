import { db } from './sqlite.js'
import { mdToHtml } from '../lib/markdown.js'

function readingMinutes(md) {
  const text = String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`\[\]()!-]/g, ' ')
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const en = (text.match(/[a-zA-Z0-9]+/g) || []).length
  const words = cn + en
  return Math.max(1, Math.ceil(words / 350))
}

function mapPost(row, tags = []) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    bodyMd: row.body_md || '',
    bodyHtml: mdToHtml(row.body_md || ''),
    coverUrl: row.cover_url || '',
    status: row.status,
    featured: !!row.featured,
    authorId: row.author_id,
    authorName: row.author_name || '',
    authorKind: row.author_kind || 'admin',
    viewCount: row.view_count || 0,
    readingMinutes: readingMinutes(row.body_md),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
  }
}

function tagsForPost(postId) {
  return db
    .prepare(
      `SELECT t.id, t.slug, t.name, t.description
       FROM blog_tags t
       JOIN blog_post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ?
       ORDER BY t.name`,
    )
    .all(postId)
}

function slugify(title) {
  const base = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `post-${Date.now()}`
}

function uniqueSlug(desired, excludeId = null) {
  let slug = desired
  let n = 2
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM blog_posts WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM blog_posts WHERE slug = ?`).get(slug)
    if (!row) return slug
    slug = `${desired}-${n++}`
  }
}

export function listTags() {
  return db
    .prepare(
      `SELECT t.*, COUNT(pt.post_id) AS post_count
       FROM blog_tags t
       LEFT JOIN blog_post_tags pt ON pt.tag_id = t.id
       LEFT JOIN blog_posts p ON p.id = pt.post_id AND p.status = 'published'
       GROUP BY t.id
       ORDER BY t.name`,
    )
    .all()
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description || '',
      postCount: t.post_count || 0,
    }))
}

export function listPosts({
  status = 'published',
  tag = '',
  q = '',
  page = 1,
  pageSize = 10,
  includeDrafts = false,
  authorId = null,
  authorKind = '',
} = {}) {
  const where = []
  const params = []

  if (!includeDrafts) {
    where.push(`p.status = 'published'`)
  } else if (status === 'published' || status === 'draft') {
    where.push(`p.status = ?`)
    params.push(status)
  }

  if (tag) {
    where.push(
      `EXISTS (SELECT 1 FROM blog_post_tags pt JOIN blog_tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = ?)`,
    )
    params.push(tag)
  }

  if (q) {
    where.push(`(p.title LIKE ? OR p.excerpt LIKE ? OR p.body_md LIKE ?)`)
    const like = `%${q}%`
    params.push(like, like, like)
  }

  if (authorId != null) {
    where.push(`p.author_id = ?`)
    params.push(Number(authorId))
  }
  if (authorKind) {
    where.push(`p.author_kind = ?`)
    params.push(authorKind)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) AS c FROM blog_posts p ${whereSql}`).get(...params).c
  const offset = (Math.max(1, page) - 1) * pageSize
  const rows = db
    .prepare(
      `SELECT p.* FROM blog_posts p ${whereSql}
       ORDER BY p.featured DESC, COALESCE(p.published_at, p.created_at) DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset)

  return {
    total,
    page: Math.max(1, page),
    pageSize,
    rows: rows.map((r) => mapPost(r, tagsForPost(r.id))),
  }
}

export function findPostBySlug(slug, { includeDraft = false } = {}) {
  const row = db.prepare(`SELECT * FROM blog_posts WHERE slug = ?`).get(slug)
  if (!row) return null
  if (!includeDraft && row.status !== 'published') return null
  return mapPost(row, tagsForPost(row.id))
}

export function findPostById(id) {
  const row = db.prepare(`SELECT * FROM blog_posts WHERE id = ?`).get(id)
  if (!row) return null
  return mapPost(row, tagsForPost(row.id))
}

export function bumpPostView(id) {
  db.prepare(`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?`).run(id)
}

/** Related published posts sharing tags (Ghost-style recommendations) */
export function relatedPosts(postId, limit = 3) {
  const rows = db
    .prepare(
      `SELECT p.*, COUNT(pt2.tag_id) AS shared
       FROM blog_posts p
       JOIN blog_post_tags pt2 ON pt2.post_id = p.id
       WHERE p.status = 'published'
         AND p.id != ?
         AND pt2.tag_id IN (SELECT tag_id FROM blog_post_tags WHERE post_id = ?)
       GROUP BY p.id
       ORDER BY shared DESC, COALESCE(p.published_at, p.created_at) DESC
       LIMIT ?`,
    )
    .all(postId, postId, limit)
  return rows.map((r) => mapPost(r, tagsForPost(r.id)))
}

export function blogStats() {
  const posts = db.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE status = 'published'`).get().c
  const drafts = db.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE status = 'draft'`).get().c
  const communityWorks = db
    .prepare(
      `SELECT COUNT(*) AS c FROM blog_posts WHERE status = 'published' AND author_kind = 'community'`,
    )
    .get().c
  const adminPosts = db
    .prepare(
      `SELECT COUNT(*) AS c FROM blog_posts WHERE status = 'published' AND (author_kind IS NULL OR author_kind = 'admin')`,
    )
    .get().c
  const tags = db.prepare(`SELECT COUNT(*) AS c FROM blog_tags`).get().c
  const views = db
    .prepare(`SELECT COALESCE(SUM(view_count), 0) AS c FROM blog_posts WHERE status = 'published'`)
    .get().c
  return { posts, drafts, communityWorks, adminPosts, tags, views }
}

export function createBlogTag({ slug, name, description = '' }) {
  const s = String(slug || name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
  if (!s) throw new Error('标签 slug 无效')
  const n = String(name || s).trim()
  try {
    const info = db
      .prepare(`INSERT INTO blog_tags (slug, name, description) VALUES (?, ?, ?)`)
      .run(s, n, String(description || ''))
    return listTags().find((t) => t.id === Number(info.lastInsertRowid))
  } catch {
    throw new Error('标签已存在')
  }
}

export function updateBlogTag(id, data) {
  const row = db.prepare(`SELECT * FROM blog_tags WHERE id = ?`).get(id)
  if (!row) return null
  const name = data.name != null ? String(data.name).trim() : row.name
  const description = data.description != null ? String(data.description) : row.description || ''
  let slug = row.slug
  if (data.slug != null) {
    slug = String(data.slug)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    if (!slug) throw new Error('标签 slug 无效')
  }
  try {
    db.prepare(`UPDATE blog_tags SET slug = ?, name = ?, description = ? WHERE id = ?`).run(
      slug,
      name,
      description,
      id,
    )
  } catch {
    throw new Error('标签 slug 冲突')
  }
  return listTags().find((t) => t.id === Number(id))
}

export function deleteBlogTag(id) {
  db.prepare(`DELETE FROM blog_post_tags WHERE tag_id = ?`).run(id)
  const info = db.prepare(`DELETE FROM blog_tags WHERE id = ?`).run(id)
  return info.changes > 0
}

function syncTags(postId, tagSlugs = []) {
  db.prepare(`DELETE FROM blog_post_tags WHERE post_id = ?`).run(postId)
  const findTag = db.prepare(`SELECT id FROM blog_tags WHERE slug = ?`)
  const insertTag = db.prepare(`INSERT INTO blog_tags (slug, name) VALUES (?, ?)`)
  const link = db.prepare(`INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`)
  for (const raw of tagSlugs) {
    const slug = String(raw).trim().toLowerCase()
    if (!slug) continue
    let tag = findTag.get(slug)
    if (!tag) {
      const name = slug
      const info = insertTag.run(slug, name)
      tag = { id: info.lastInsertRowid }
    }
    link.run(postId, tag.id)
  }
}

export function createPost(data, actor, { kind = 'admin' } = {}) {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('标题必填')
  const slug = uniqueSlug(data.slug?.trim() || slugify(title))
  const status = data.status === 'published' ? 'published' : 'draft'
  const featured = kind === 'admin' && data.featured ? 1 : 0
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const publishedAt = status === 'published' ? data.publishedAt || now : null
  const authorName = actor?.displayName || actor?.username || ''

  const info = db
    .prepare(
      `INSERT INTO blog_posts
        (slug, title, excerpt, body_md, cover_url, status, featured, author_id, author_name, author_kind, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      title,
      String(data.excerpt || '').trim(),
      String(data.bodyMd || data.body || ''),
      String(data.coverUrl || ''),
      status,
      featured,
      actor?.sub != null ? Number(actor.sub) : null,
      authorName,
      kind === 'community' ? 'community' : 'admin',
      publishedAt,
      now,
      now,
    )

  const id = info.lastInsertRowid
  if (Array.isArray(data.tags)) syncTags(id, data.tags)
  return findPostById(id)
}

export function updatePost(id, data, actor) {
  const existing = findPostById(id)
  if (!existing) return null

  const title = data.title != null ? String(data.title).trim() : existing.title
  const slug =
    data.slug != null
      ? uniqueSlug(String(data.slug).trim() || slugify(title), Number(id))
      : existing.slug
  const status = data.status != null ? (data.status === 'published' ? 'published' : 'draft') : existing.status
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let publishedAt = existing.publishedAt
  if (status === 'published' && !publishedAt) publishedAt = now
  if (status === 'draft') publishedAt = null
  if (data.publishedAt) publishedAt = data.publishedAt

  db.prepare(
    `UPDATE blog_posts SET
      slug = ?, title = ?, excerpt = ?, body_md = ?, cover_url = ?, status = ?,
      featured = ?, published_at = ?, updated_at = ?,
      author_name = COALESCE(author_name, ?)
     WHERE id = ?`,
  ).run(
    slug,
    title,
    data.excerpt != null ? String(data.excerpt).trim() : existing.excerpt,
    data.bodyMd != null || data.body != null ? String(data.bodyMd || data.body || '') : existing.bodyMd,
    data.coverUrl != null ? String(data.coverUrl) : existing.coverUrl,
    status,
    data.featured != null ? (data.featured ? 1 : 0) : existing.featured ? 1 : 0,
    publishedAt,
    now,
    actor?.username || '',
    id,
  )

  if (Array.isArray(data.tags)) syncTags(id, data.tags)
  return findPostById(id)
}

export function deletePost(id) {
  const info = db.prepare(`DELETE FROM blog_posts WHERE id = ?`).run(id)
  return info.changes > 0
}
