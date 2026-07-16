import { Hono } from 'hono'
import {
  listPosts,
  listTags,
  findPostBySlug,
  findPostById,
  createPost,
  updatePost,
  deletePost,
  bumpPostView,
  relatedPosts,
  blogStats,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
} from '../db/blog.js'
import { addOpLog } from '../db/logs.js'
import { awardPoints } from '../db/members.js'
import { requireAuth, requireCommunityAuth, requireCsrf } from '../middleware/auth.js'
import { verifyToken } from '../lib/jwt.js'
import { renderBlogCards, renderAdminPostRows } from '../views/blog.js'

export const blogRoutes = new Hono()

blogRoutes.get('/stats', (c) => c.json({ code: 0, data: blogStats() }))

blogRoutes.get('/tags', (c) => c.json({ code: 0, data: listTags() }))

blogRoutes.post('/tags', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const tag = createBlogTag(body)
    return c.json({ code: 0, msg: '已创建', data: tag }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

blogRoutes.put('/tags/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const tag = updateBlogTag(c.req.param('id'), body)
    if (!tag) return c.json({ code: 404, msg: '标签不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: tag })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

blogRoutes.delete('/tags/:id', requireAuth, requireCsrf, (c) => {
  if (!deleteBlogTag(c.req.param('id'))) return c.json({ code: 404, msg: '标签不存在' }, 404)
  return c.json({ code: 0, msg: '已删除' })
})

blogRoutes.get('/posts', async (c) => {
  const q = c.req.query()
  const admin = q.admin === '1'
  if (admin) {
    // Draft listing requires auth — reuse middleware manually
    const header = c.req.header('Authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return c.json({ code: 401, msg: 'Unauthorized' }, 401)
    try {
      c.set('user', await verifyToken(token))
    } catch {
      return c.json({ code: 401, msg: 'Unauthorized' }, 401)
    }
  }
  const result = listPosts({
    status: q.status || '',
    tag: q.tag || '',
    q: q.q || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 10),
    includeDrafts: admin,
    authorId: q.authorId || null,
    authorKind: q.authorKind || '',
  })

  if (q.format === 'html' || c.req.header('HX-Request')) {
    if (admin) return c.html(renderAdminPostRows(result.rows))
    return c.html(renderBlogCards(result.rows))
  }
  return c.json({ code: 0, data: result })
})

/** Community: my works (published + drafts) */
blogRoutes.get('/works/mine', requireCommunityAuth, (c) => {
  const member = c.get('member')
  const result = listPosts({
    page: Number(c.req.query('page') || 1),
    pageSize: Number(c.req.query('pageSize') || 20),
    includeDrafts: true,
    authorId: Number(member.sub),
    authorKind: 'community',
  })
  return c.json({ code: 0, data: result })
})

/** Community publishes a work (= blog post) */
blogRoutes.post('/works', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const actor = c.get('member')
    const post = createPost(
      {
        ...body,
        status: body.status === 'draft' ? 'draft' : 'published',
        featured: false,
      },
      actor,
      { kind: 'community' },
    )
    if (post.status === 'published') {
      awardPoints(Number(actor.sub), 'work', { refType: 'work', refId: post.id })
    }
    return c.json({ code: 0, msg: '博客已发布', data: post }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

blogRoutes.get('/posts/:slug', (c) => {
  const includeDraft = c.req.query('preview') === '1'
  const post = findPostBySlug(c.req.param('slug'), { includeDraft })
  if (!post) return c.json({ code: 404, msg: '文章不存在' }, 404)
  if (post.status === 'published') bumpPostView(post.id)
  const fresh = findPostBySlug(c.req.param('slug'), { includeDraft: true })
  const related = relatedPosts(fresh.id, 3)
  return c.json({ code: 0, data: { ...fresh, related } })
})

blogRoutes.post('/posts', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const post = createPost(body, c.get('user'), { kind: 'admin' })
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '博客',
      action: '新增',
      detail: `发布文章 ${post.title}`,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '创建成功', data: post }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

blogRoutes.put('/posts/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const post = updatePost(c.req.param('id'), body, c.get('user'))
  if (!post) return c.json({ code: 404, msg: '文章不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '博客',
    action: '编辑',
    detail: `更新文章 ${post.title}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '更新成功', data: post })
})

blogRoutes.delete('/posts/:id', requireAuth, requireCsrf, (c) => {
  const id = c.req.param('id')
  const existing = findPostById(id)
  if (!existing || !deletePost(id)) return c.json({ code: 404, msg: '文章不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '博客',
    action: '删除',
    detail: `删除文章 ${existing.title}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})
