import { apiUrl } from './api-base.js'

export const AUTH_TOKEN_KEY = 'hatax_token'

/** Exact paths that do not require a session token */
export const PUBLIC_PATHS = [
  '/',
  '/index.html',
  '/admin/login.html',
  '/admin/lock.html',
  '/admin/error-403.html',
  '/admin/error-404.html',
  '/admin/error-500.html',
]

/** Path prefixes that are always public (官网 / 落地页 / 用户端) */
export const PUBLIC_PREFIXES = ['/pages/']

export function getToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
}

export function isPublicPath(pathname = location.pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (PUBLIC_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))) {
    return true
  }
  return PUBLIC_PATHS.some((p) => {
    const normalized = p.replace(/\/+$/, '') || '/'
    return path === normalized || path.endsWith(normalized)
  })
}

export function loginRedirectUrl() {
  const redirect = encodeURIComponent(location.pathname + location.search)
  return `/admin/login.html?redirect=${redirect}`
}

/** Guard protected pages — call before Alpine.start() */
export function requireAuth() {
  if (isPublicPath()) return true
  if (getToken()) return true
  location.replace(loginRedirectUrl())
  return false
}

export async function logout() {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        'X-CSRF-Token': sessionStorage.getItem('hatax_csrf') || '',
      },
    })
  } catch {
    /* ignore */
  }
  clearToken()
  sessionStorage.removeItem('hatax_csrf')
  location.href = '/admin/login.html'
}

/** Resolve post-login redirect (same-origin path only) */
export function consumeRedirect(defaultPath = '/admin/dashboard.html') {
  const params = new URLSearchParams(location.search)
  const redirect = params.get('redirect')
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return defaultPath
}

if (typeof window !== 'undefined') {
  window.hataxLogout = logout
}
