import { esc } from './escape.js'

export function renderDeptRows(depts, depth = 0) {
  const pad = depth === 0 ? '' : depth === 1 ? 'pl-12' : 'pl-20'
  const bg = depth > 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
  let html = ''
  for (const d of depts) {
    const hasChildren = d.children?.length > 0
    const statusCls =
      d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    const statusLabel = d.status === 'active' ? '启用' : '停用'
    html += `
<tr class="${bg}" data-dept-id="${d.id}">
  <td class="px-4 py-3 ${pad}">
    ${
      hasChildren
        ? `<button type="button" class="inline-flex items-center" aria-label="Toggle"><svg class="w-3.5 h-3.5 text-gray-400 rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>`
        : ''
    }
  </td>
  <td class="px-4 py-3"><div class="flex items-center gap-2"><span class="font-medium">${esc(d.name)}</span></div></td>
  <td class="px-4 py-3 text-center">${d.sort}</td>
  <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 ${statusCls} rounded text-xs">${statusLabel}</span></td>
  <td class="px-4 py-3 text-right">
    <a href="/admin/dept-form.html?parentId=${d.id}" class="text-green-500 hover:text-green-700 text-sm mr-2">新增</a>
    <a href="/admin/dept-form.html?id=${d.id}" class="text-blue-500 hover:text-blue-700 text-sm mr-2">编辑</a>
    <button type="button" class="text-red-500 hover:text-red-700 text-sm"
      hx-delete="/api/depts/${d.id}"
      hx-confirm="确定删除该部门？"
      hx-target="#dept-tree-container"
      hx-swap="innerHTML">删除</button>
  </td>
</tr>`
    if (hasChildren) html += renderDeptRows(d.children, depth + 1)
  }
  return html
}
