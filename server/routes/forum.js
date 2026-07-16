import { Hono } from 'hono'
import {
  listCategories,
  listTopics,
  listForumTags,
  findTopicById,
  findPostById,
  listReplies,
  createTopic,
  createReply,
  updateTopic,
  deleteTopic,
  deleteReply,
  createCategory,
  updateCategory,
  deleteCategory,
  createForumTag,
  updateForumTag,
  deleteForumTag,
  bumpTopicView,
  toggleLike,
  userLiked,
  forumStats,
} from '../db/forum.js'
import { addOpLog } from '../db/logs.js'
import { awardPoints } from '../db/members.js'
import { requireAuth, requireCommunityAuth, requireCsrf } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optional-auth.js'
import { renderCategoryCards, renderTopicList, renderAdminTopicRows } from '../views/forum.js'

export const forumRoutes = new Hono()

forumRoutes.get('/stats', (c) => c.json({ code: 0, data: forumStats() }))

forumRoutes.get('/categories', (c) => {
  const rows = listCategories()
  if (c.req.query('format') === 'html' || c.req.header('HX-Request')) {
    return c.html(renderCategoryCards(rows))
  }
  return c.json({ code: 0, data: rows })
})

forumRoutes.get('/tags', (c) => c.json({ code: 0, data: listForumTags() }))

forumRoutes.post('/categories', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const row = createCategory(body)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '论坛',
      action: '新增分区',
      detail: row.name,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '已创建', data: row }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

forumRoutes.put('/categories/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const row = updateCategory(c.req.param('id'), body)
    if (!row) return c.json({ code: 404, msg: '分区不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: row })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

forumRoutes.delete('/categories/:id', requireAuth, requireCsrf, (c) => {
  try {
    if (!deleteCategory(c.req.param('id'))) return c.json({ code: 404, msg: '分区不存在' }, 404)
    return c.json({ code: 0, msg: '已删除' })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

forumRoutes.post('/tags', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const row = createForumTag(body)
    return c.json({ code: 0, msg: '已创建', data: row }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

forumRoutes.put('/tags/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const row = updateForumTag(c.req.param('id'), body)
    if (!row) return c.json({ code: 404, msg: '标签不存在' }, 404)
    return c.json({ code: 0, msg: '已更新', data: row })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

forumRoutes.delete('/tags/:id', requireAuth, requireCsrf, (c) => {
  if (!deleteForumTag(c.req.param('id'))) return c.json({ code: 404, msg: '标签不存在' }, 404)
  return c.json({ code: 0, msg: '已删除' })
})

forumRoutes.delete('/replies/:id', requireAuth, requireCsrf, (c) => {
  const existing = findPostById(c.req.param('id'))
  if (!existing || !deleteReply(c.req.param('id'))) {
    return c.json({ code: 404, msg: '回复不存在' }, 404)
  }
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '论坛',
    action: '删除回复',
    detail: `删除回复 #${existing.id} (帖子 #${existing.topicId})`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})

forumRoutes.get('/topics', (c) => {
  const q = c.req.query()
  const result = listTopics({
    category: q.category || '',
    q: q.q || '',
    tag: q.tag || '',
    page: Number(q.page || 1),
    pageSize: Number(q.pageSize || 20),
    sort: q.sort || 'latest',
  })
  if (q.format === 'html' || c.req.header('HX-Request')) {
    if (q.admin === '1') return c.html(renderAdminTopicRows(result.rows))
    return c.html(renderTopicList(result.rows))
  }
  return c.json({ code: 0, data: result })
})

forumRoutes.get('/topics/:id', optionalAuth, (c) => {
  const id = c.req.param('id')
  const topic = findTopicById(id)
  if (!topic) return c.json({ code: 404, msg: '主题不存在' }, 404)
  bumpTopicView(id)
  const fresh = findTopicById(id)
  const replies = listReplies(id)
  const user = c.get('member') || c.get('user')
  const uid = user?.sub != null ? Number(user.sub) : null
  return c.json({
    code: 0,
    data: {
      topic: fresh,
      replies,
      liked: uid ? userLiked(uid, 'topic', Number(id)) : false,
    },
  })
})

/** Community: create topic */
forumRoutes.post('/topics', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const actor = c.get('member') || c.get('user')
    const topic = createTopic(body, actor)
    awardPoints(Number(actor.sub), 'topic', { refType: 'topic', refId: topic.id })
    return c.json({ code: 0, msg: '发帖成功', data: topic }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

/** Community: reply */
forumRoutes.post('/topics/:id/replies', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const actor = c.get('member') || c.get('user')
    const reply = createReply(c.req.param('id'), body, actor)
    if (!reply) return c.json({ code: 404, msg: '主题不存在' }, 404)
    awardPoints(Number(actor.sub), 'reply', { refType: 'post', refId: reply.id })
    return c.json({ code: 0, msg: '回复成功', data: reply }, 201)
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

/** Admin only: pin / lock / edit title */
forumRoutes.put('/topics/:id', requireAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  try {
    const topic = updateTopic(c.req.param('id'), body)
    if (!topic) return c.json({ code: 404, msg: '主题不存在' }, 404)
    addOpLog({
      operator: c.get('user')?.username || 'system',
      module: '论坛',
      action: '编辑',
      detail: `更新主题 #${topic.id} ${topic.title}`,
      ip: c.req.header('x-forwarded-for') || '',
      status: 'Success',
    })
    return c.json({ code: 0, msg: '更新成功', data: topic })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})

/** Admin only: delete topic */
forumRoutes.delete('/topics/:id', requireAuth, requireCsrf, (c) => {
  const id = c.req.param('id')
  const existing = findTopicById(id)
  if (!existing || !deleteTopic(id)) return c.json({ code: 404, msg: '主题不存在' }, 404)
  addOpLog({
    operator: c.get('user')?.username || 'system',
    module: '论坛',
    action: '删除',
    detail: `删除主题 ${existing.title}`,
    ip: c.req.header('x-forwarded-for') || '',
    status: 'Success',
  })
  return c.json({ code: 0, msg: '已删除' })
})

/** Community: like */
forumRoutes.post('/likes', requireCommunityAuth, requireCsrf, async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }
  const user = c.get('member') || c.get('user')
  try {
    const uid = Number(user.sub)
    const targetType = body.targetType
    const targetId = Number(body.targetId)
    let authorId = null
    if (targetType === 'topic') {
      authorId = findTopicById(targetId)?.authorId ?? null
    } else if (targetType === 'post') {
      authorId = findPostById(targetId)?.authorId ?? null
    }

    const result = toggleLike(uid, targetType, targetId)
    if (result.liked) {
      awardPoints(uid, 'like', { refType: targetType, refId: targetId })
      if (authorId && Number(authorId) !== uid) {
        awardPoints(Number(authorId), 'liked', { refType: targetType, refId: targetId })
      }
    }
    return c.json({ code: 0, data: result })
  } catch (e) {
    return c.json({ code: 400, msg: e.message }, 400)
  }
})
