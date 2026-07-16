import { esc } from './escape.js'

const ROLE_LABEL = {
  admin: '超级管理员',
  operator: '运营主管',
  editor: '内容编辑',
  user: '普通用户',
  viewer: '普通用户',
}

const STATUS_LABEL = {
  active: '正常',
  disabled: '禁用',
}

function maskPhone(phone) {
  const p = String(phone || '')
  if (p.length < 7) return esc(p)
  return esc(p.slice(0, 3) + '****' + p.slice(-4))
}

function avatarChar(username) {
  return esc((username || '?').slice(0, 1))
}

function roleBadge(role) {
  const label = ROLE_LABEL[role] || role
  const cls =
    role === 'admin'
      ? 'bg-purple-100 text-purple-700'
      : role === 'operator'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return `<span class="px-2 py-0.5 ${cls} rounded text-xs">${esc(label)}</span>`
}

function statusBadge(status) {
  const label = STATUS_LABEL[status] || status
  const cls =
    status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  return `<span class="px-2 py-0.5 ${cls} rounded text-xs">${esc(label)}</span>`
}

/** Render user table rows for #user-tbody */
export function renderUserRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>`
  }
  return rows
    .map(
      (u) => `
<tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
  <td class="px-4 py-3"><input type="checkbox" class="w-4 h-4 rounded" aria-label="Select user ${u.id}"></td>
  <td class="px-4 py-3 text-gray-500">${u.id}</td>
  <td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">${avatarChar(u.username)}</div><span class="font-medium">${esc(u.username)}</span></div></td>
  <td class="px-4 py-3 text-gray-500">${maskPhone(u.phone)}</td>
  <td class="px-4 py-3">${roleBadge(u.role)}</td>
  <td class="px-4 py-3">${statusBadge(u.status)}</td>
  <td class="px-4 py-3 text-gray-500 text-sm">${esc(u.createdAt)}</td>
  <td class="px-4 py-3 text-right">
    <a href="/admin/user-form.html?id=${u.id}" class="text-blue-500 hover:text-blue-700 text-sm mr-3">编辑</a>
    <button type="button" class="text-red-500 hover:text-red-700 text-sm"
      hx-delete="/api/users/${u.id}"
      hx-confirm="确定要删除该用户吗？"
      hx-target="#user-tbody"
      hx-swap="innerHTML">删除</button>
  </td>
</tr>`,
    )
    .join('')
}

export function renderPaginationMeta(total) {
  return `共 ${total} 条记录`
}
