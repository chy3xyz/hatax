import { publicTheme } from './theme.js'
import { isLoggedIn, loginUrl, registerUrl, getUser, logout } from './api.js'

export function formatDate(value, withTime = false) {
  if (!value) return ''
  const s = String(value)
  return withTime ? s.slice(0, 16).replace('T', ' ') : s.slice(0, 10)
}

/** Human-friendly relative time for forum lists */
export function relativeTime(value) {
  if (!value) return ''
  const raw = String(value).replace(' ', 'T')
  const t = new Date(raw.includes('T') ? raw : raw.replace(/-/g, '/')).getTime()
  if (Number.isNaN(t)) return formatDate(value, true)
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return formatDate(value)
}

export function excerptText(md, max = 96) {
  const plain = String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  return plain.slice(0, max).trimEnd() + '…'
}

export function avatarChar(name) {
  return String(name || '?').trim().slice(0, 1).toUpperCase() || '?'
}

const NAV_ICONS = {
  home: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>',
  work: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2H8.5A2.5 2.5 0 0 0 6 5.5v14zM8 6h8M8 10h8M8 14h5"/></svg>',
  chat: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 1 1-3.2-6.9L21 5v7z"/></svg>',
  plus: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>',
  calendar: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path stroke-linecap="round" d="M8 13h3v3H8z"/></svg>',
  book: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5zM8 7h8M8 11h8"/></svg>',
  check: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4"/></svg>',
  user: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
}

/** Shared chrome + community auth helpers for public site pages */
export function siteChrome(active = '') {
  const user = getUser()
  return {
    ...publicTheme(),
    active,
    mobileMenuOpen: false,
    loggedIn: isLoggedIn(),
    user,
    displayName: user?.displayName || user?.username || '',
    loginUrl,
    registerUrl,
    meUrl: '/pages/me.html',
    createUrl: '/pages/create.html',
    workNewUrl: '/pages/work-new.html',
    topicNewUrl: '/pages/forum-new.html',
    authReturn() {
      if (typeof location === 'undefined') return '/pages/forum.html'
      return location.pathname + location.search
    },
    navIcon(name) {
      return NAV_ICONS[name] || NAV_ICONS.home
    },
    logout() {
      logout('/pages/forum.html')
    },
    /** 顶栏：博客 / 论坛 */
    navItems: [
      { key: 'home', label: '官网', href: '/pages/index.html' },
      { key: 'blog', label: '博客', href: '/pages/blog.html' },
      { key: 'forum', label: '论坛', href: '/pages/forum.html' },
      { key: 'tasks', label: '任务', href: '/pages/tasks.html' },
      { key: 'courses', label: '课程', href: '/pages/courses.html' },
      { key: 'events', label: '活动', href: '/pages/events.html' },
    ],
    /** 手机底栏 */
    bottomNavItems: [
      { key: 'home', label: '首页', href: '/pages/index.html', icon: 'home' },
      { key: 'blog', label: '博客', href: '/pages/blog.html', icon: 'work' },
      { key: 'events', label: '活动', href: '/pages/events.html', icon: 'calendar' },
      { key: 'forum', label: '论坛', href: '/pages/forum.html', icon: 'chat' },
      { key: 'me', label: '我的', href: '/pages/me.html', icon: 'user' },
    ],
  }
}
