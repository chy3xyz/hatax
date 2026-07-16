import { esc } from './escape.js'

export function renderBlogCards(rows) {
  if (!rows.length) {
    return `<div class="col-span-full py-16 text-center text-gray-400">暂无文章</div>`
  }
  return rows
    .map((p) => {
      const tags = (p.tags || [])
        .map(
          (t) =>
            `<a href="/pages/blog.html?tag=${esc(t.slug)}" class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20">${esc(t.name)}</a>`,
        )
        .join(' ')
      const date = esc((p.publishedAt || p.createdAt || '').slice(0, 10))
      return `
<article class="border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-primary/40 transition-colors">
  <div class="flex items-center gap-2 text-xs text-gray-400 mb-2">
    <time>${date}</time>
    <span>·</span>
    <span>${esc(p.authorName || '匿名')}</span>
    <span>·</span>
    <span>${p.viewCount || 0} 阅读</span>
  </div>
  <h2 class="text-xl font-semibold">
    <a href="/pages/blog-post.html?slug=${esc(p.slug)}" class="hover:text-primary">${esc(p.title)}</a>
  </h2>
  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">${esc(p.excerpt || '')}</p>
  <div class="mt-4 flex flex-wrap gap-2">${tags}</div>
</article>`
    })
    .join('\n')
}

export function renderAdminPostRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无文章</td></tr>`
  }
  return rows
    .map((p) => {
      const statusCls =
        p.status === 'published'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      const statusLabel = p.status === 'published' ? '已发布' : '草稿'
      return `<tr class="border-b border-gray-100 dark:border-gray-800">
  <td class="px-4 py-3 text-sm font-medium">${esc(p.title)}</td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc(p.slug)}</td>
  <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full ${statusCls}">${statusLabel}</span></td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc(p.authorName)}</td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc((p.publishedAt || p.updatedAt || '').slice(0, 16))}</td>
  <td class="px-4 py-3 text-sm whitespace-nowrap">
    <a href="/pages/blog-post.html?slug=${esc(p.slug)}" class="text-primary hover:underline mr-3" target="_blank">预览</a>
    <button type="button" class="text-blue-500 hover:underline mr-3" data-edit-post="${p.id}">编辑</button>
    <button type="button" class="text-red-500 hover:underline" data-del-post="${p.id}">删除</button>
  </td>
</tr>`
    })
    .join('\n')
}
