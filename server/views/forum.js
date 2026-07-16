import { esc } from './escape.js'

export function renderCategoryCards(rows) {
  if (!rows.length) {
    return `<div class="py-12 text-center text-gray-400">暂无分区</div>`
  }
  return rows
    .map(
      (c) => `
<a href="/pages/forum.html?category=${esc(c.slug)}" class="block border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-primary/40 transition-colors">
  <div class="flex items-start gap-3">
    <span class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style="background:${esc(c.color)}"></span>
    <div class="min-w-0 flex-1">
      <h3 class="font-semibold">${esc(c.name)}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${esc(c.description)}</p>
      <div class="mt-2 text-xs text-gray-400">${c.topicCount || 0} 个主题</div>
    </div>
  </div>
</a>`,
    )
    .join('\n')
}

export function renderTopicList(rows) {
  if (!rows.length) {
    return `<div class="py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">暂无主题</div>`
  }
  return `
<div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
${rows
  .map((t) => {
    const badges = [
      t.pinned ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">置顶</span>` : '',
      t.locked ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800">已锁</span>` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `
<a href="/pages/forum-topic.html?id=${t.id}" class="flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
  <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style="background:${esc(t.categoryColor)}">${esc((t.authorName || '?').slice(0, 1))}</div>
  <div class="min-w-0 flex-1">
    <div class="flex flex-wrap items-center gap-2">
      ${badges}
      <span class="text-xs px-2 py-0.5 rounded-full" style="background:${esc(t.categoryColor)}22;color:${esc(t.categoryColor)}">${esc(t.categoryName)}</span>
    </div>
    <h2 class="mt-1 font-semibold truncate">${esc(t.title)}</h2>
    <div class="mt-2 text-xs text-gray-400">${esc(t.authorName)} · ${t.replyCount} 回复 · ${t.likeCount} 赞 · ${esc((t.lastReplyAt || t.createdAt || '').slice(0, 16))}</div>
  </div>
</a>`
  })
  .join('\n')}
</div>`
}

export function renderAdminTopicRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无主题</td></tr>`
  }
  return rows
    .map(
      (t) => `<tr class="border-b border-gray-100 dark:border-gray-800">
  <td class="px-4 py-3 text-sm font-medium">${esc(t.title)}</td>
  <td class="px-4 py-3 text-sm">${esc(t.categoryName)}</td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc(t.authorName)}</td>
  <td class="px-4 py-3 text-sm">${t.replyCount} / ${t.likeCount}</td>
  <td class="px-4 py-3 text-sm">${t.pinned ? '置顶' : '-'} ${t.locked ? '锁定' : ''}</td>
  <td class="px-4 py-3 text-sm whitespace-nowrap">
    <a href="/pages/forum-topic.html?id=${t.id}" class="text-primary hover:underline mr-2" target="_blank">查看</a>
    <button type="button" class="text-blue-500 hover:underline mr-2" data-pin-topic="${t.id}" data-pinned="${t.pinned ? 1 : 0}">${t.pinned ? '取消置顶' : '置顶'}</button>
    <button type="button" class="text-amber-600 hover:underline mr-2" data-lock-topic="${t.id}" data-locked="${t.locked ? 1 : 0}">${t.locked ? '解锁' : '锁定'}</button>
    <button type="button" class="text-red-500 hover:underline" data-del-topic="${t.id}">删除</button>
  </td>
</tr>`,
    )
    .join('\n')
}
