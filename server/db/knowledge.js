import { listPosts } from './blog.js'
import { listTopics } from './forum.js'
import { listCourses } from './courses.js'
import { listTasks } from './tasks.js'
import { listEvents } from './events.js'

const TYPE_LABEL = {
  blog: '博客',
  forum: '论坛',
  course: '课程',
  task: '任务',
  event: '活动',
}

function plain(text, max = 180) {
  const s = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (s.length <= max) return s
  return `${s.slice(0, max).trimEnd()}…`
}

const STOP = new Set([
  '如何',
  '怎么',
  '怎样',
  '什么',
  '哪些',
  '哪个',
  '有没有',
  '请问',
  '一下',
  '可以',
  '吗',
  '呢',
  '啊',
  '的',
  '了',
  '是',
  '在',
  '我',
  '想',
  '帮',
  '介绍',
])

function tokens(q) {
  const raw = String(q || '').toLowerCase()
  const parts = raw
    .split(/[\s,，。！？？、；：？?！!]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const out = [...parts]
  // Split long CJK phrases into 2-grams for better recall
  for (const p of parts) {
    if (/^[\u4e00-\u9fff]+$/.test(p) && p.length >= 4) {
      for (let i = 0; i < p.length - 1; i++) out.push(p.slice(i, i + 2))
    }
  }
  return [...new Set(out)].filter((t) => t.length >= 1 && !STOP.has(t))
}

/** Query variants: full string + meaningful keywords */
function queryVariants(q) {
  const base = String(q || '').trim()
  const variants = [base]
  for (const t of tokens(base)) {
    if (t.length >= 2) variants.push(t)
  }
  return [...new Set(variants.filter(Boolean))]
}

function scoreMatch(query, title, body = '') {
  const q = String(query || '').toLowerCase()
  const t = String(title || '').toLowerCase()
  const b = String(body || '').toLowerCase()
  let score = 0
  if (!q) return 0
  if (t.includes(q)) score += 12
  if (b.includes(q)) score += 4
  for (const tok of tokens(q)) {
    if (tok.length < 2) continue
    if (t.includes(tok)) score += 5
    if (b.includes(tok)) score += 2
  }
  return score
}

function mergeHit(map, hit) {
  const prev = map.get(hit.url)
  if (!prev || hit.score > prev.score) map.set(hit.url, hit)
}

/**
 * Search site content and return ranked hits for customer-service / RAG.
 */
export function searchKnowledge(query, { limit = 8 } = {}) {
  const q = String(query || '').trim()
  if (!q) return []

  const variants = queryVariants(q)
  const byUrl = new Map()

  for (const v of variants) {
    try {
      const posts = listPosts({ q: v, page: 1, pageSize: 5, includeDrafts: false })
      for (const p of posts.rows) {
        mergeHit(byUrl, {
          type: 'blog',
          typeLabel: TYPE_LABEL.blog,
          id: p.id,
          title: p.title,
          url: `/pages/blog-post.html?slug=${encodeURIComponent(p.slug)}`,
          snippet: p.excerpt || plain(p.bodyMd),
          score: scoreMatch(q, p.title, `${p.excerpt} ${p.bodyMd}`) + (p.featured ? 2 : 0),
        })
      }
    } catch {
      /* ignore */
    }

    try {
      const topics = listTopics({ q: v, page: 1, pageSize: 5 })
      for (const t of topics.rows) {
        mergeHit(byUrl, {
          type: 'forum',
          typeLabel: TYPE_LABEL.forum,
          id: t.id,
          title: t.title,
          url: `/pages/forum-topic.html?id=${t.id}`,
          snippet: plain(t.bodyMd || ''),
          score: scoreMatch(q, t.title, t.bodyMd) + (t.pinned ? 2 : 0),
        })
      }
    } catch {
      /* ignore */
    }

    try {
      for (const c of listCourses({ q: v }).slice(0, 5)) {
        mergeHit(byUrl, {
          type: 'course',
          typeLabel: TYPE_LABEL.course,
          id: c.id,
          title: c.title,
          url: `/pages/course.html?slug=${encodeURIComponent(c.slug)}`,
          snippet: c.subtitle || c.summary || `积分 ${c.pricePoints ?? 0}`,
          score: scoreMatch(q, c.title, `${c.subtitle} ${c.summary}`),
        })
      }
    } catch {
      /* ignore */
    }

    try {
      for (const t of listTasks({ q: v }).slice(0, 5)) {
        mergeHit(byUrl, {
          type: 'task',
          typeLabel: TYPE_LABEL.task,
          id: t.id,
          title: t.title,
          url: `/pages/task.html?id=${t.id}`,
          snippet: plain(t.description || '') || `+${t.rewardPoints ?? 0} 积分`,
          score: scoreMatch(q, t.title, t.description),
        })
      }
    } catch {
      /* ignore */
    }

    try {
      for (const e of listEvents({ q: v, upcomingOnly: false }).slice(0, 5)) {
        mergeHit(byUrl, {
          type: 'event',
          typeLabel: TYPE_LABEL.event,
          id: e.id,
          title: e.title,
          url: `/pages/event.html?slug=${encodeURIComponent(e.slug)}`,
          snippet: e.subtitle || e.summary || e.location || '',
          score: scoreMatch(q, e.title, `${e.subtitle} ${e.summary} ${e.location}`),
        })
      }
    } catch {
      /* ignore */
    }
  }

  let hits = [...byUrl.values()].filter((h) => h.score > 0)
  // If scoring filtered everything but SQL found rows, keep top SQL hits with a floor score
  if (!hits.length && byUrl.size) {
    hits = [...byUrl.values()].map((h) => ({ ...h, score: Math.max(h.score, 1) }))
  }

  return hits
    .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)))
    .slice(0, Math.max(1, Math.min(20, Number(limit) || 8)))
}

export function formatHitsAsContext(hits) {
  if (!hits.length) return '（站内暂无匹配内容）'
  return hits
    .map(
      (h, i) =>
        `${i + 1}. [${h.typeLabel}] ${h.title}\n   链接: ${h.url}\n   摘要: ${h.snippet || '无'}`,
    )
    .join('\n\n')
}

export function formatHitsAsReply(hits, query) {
  if (!hits.length) {
    return (
      `没有在站内找到与「${query}」直接相关的内容。\n\n` +
      `你可以试试：浏览博客、论坛发帖求助，或查看任务 / 课程 / 活动入口。`
    )
  }
  const lines = [`已为你汇聚 ${hits.length} 条相关内容：`, '']
  for (const h of hits) {
    lines.push(`• 【${h.typeLabel}】${h.title}`)
    if (h.snippet) lines.push(`  ${h.snippet}`)
    lines.push(`  → ${h.url}`)
    lines.push('')
  }
  lines.push('点击上方链接即可查看详情。若已配置大模型，还可获得自然语言总结。')
  return lines.join('\n')
}

export { TYPE_LABEL }
