import { Hono } from 'hono'
import { config } from '../config.js'
import { searchKnowledge, formatHitsAsContext, formatHitsAsReply } from '../db/knowledge.js'
import { aiStatus, completeWithLlm } from '../lib/ai-client.js'

export const aiRoutes = new Hono()

/** Simple per-IP rate limit for chat */
const buckets = new Map()

function rateLimit(ip, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  let b = buckets.get(ip)
  if (!b || now - b.start > windowMs) {
    b = { start: now, count: 0 }
    buckets.set(ip, b)
  }
  b.count += 1
  return b.count <= limit
}

aiRoutes.get('/status', (c) => c.json({ code: 0, msg: 'ok', data: aiStatus() }))

aiRoutes.get('/search', (c) => {
  const q = String(c.req.query('q') || '').trim()
  if (!q) return c.json({ code: 400, msg: '缺少 q' }, 400)
  if (q.length > 200) return c.json({ code: 400, msg: '查询过长' }, 400)
  const limit = Math.min(20, Math.max(1, Number(c.req.query('limit') || 8)))
  const hits = searchKnowledge(q, { limit })
  return c.json({ code: 0, msg: 'ok', data: { q, hits } })
})

aiRoutes.post('/chat', async (c) => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'local'
  if (!rateLimit(ip, config.aiRateLimit)) {
    return c.json({ code: 429, msg: '提问太频繁，请稍后再试' }, 429)
  }

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, msg: 'Invalid JSON' }, 400)
  }

  const message = String(body.message || body.q || '').trim()
  if (!message) return c.json({ code: 400, msg: '请输入问题' }, 400)
  if (message.length > 1000) return c.json({ code: 400, msg: '问题过长' }, 400)

  const history = Array.isArray(body.history) ? body.history : []
  const hits = searchKnowledge(message, { limit: 8 })
  const status = aiStatus()

  let reply = formatHitsAsReply(hits, message)
  let mode = 'aggregate'

  if (status.llm) {
    try {
      const system = [
        '你是 HatTax 社区的客服助手。根据「站内检索结果」用简洁中文回答用户。',
        '优先引用检索到的标题与链接；不要编造不存在的页面或价格。',
        '若检索为空，诚实说明并建议去博客 / 论坛 / 任务 / 课程 / 活动逛逛。',
        '回答控制在 300 字以内，可列 3～5 条要点，并附上相关链接。',
      ].join('')
      const user = `用户问题：${message}\n\n站内检索结果：\n${formatHitsAsContext(hits)}`
      const llmReply = await completeWithLlm({ system, user, history })
      if (llmReply) {
        reply = llmReply
        mode = 'llm'
      }
    } catch (err) {
      console.error('[ai/chat] llm failed:', err.message || err)
      reply = `${formatHitsAsReply(hits, message)}\n\n（大模型暂时不可用，已回退为站内汇聚结果）`
      mode = 'aggregate_fallback'
    }
  }

  return c.json({
    code: 0,
    msg: 'ok',
    data: {
      reply,
      mode,
      llm: status.llm,
      sources: hits.map(({ type, typeLabel, title, url, snippet }) => ({
        type,
        typeLabel,
        title,
        url,
        snippet,
      })),
    },
  })
})
