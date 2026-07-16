import { API_BASE, apiUrl } from '../api-base.js'

export { apiUrl, API_BASE }

const TOKEN_KEY = 'hatax_community_token'
const CSRF_KEY = 'hatax_csrf'
const USER_KEY = 'hatax_community_user'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

export function getCsrf() {
  return sessionStorage.getItem(CSRF_KEY) || ''
}

export function setCsrf(token) {
  if (token) sessionStorage.setItem(CSRF_KEY, token)
  else sessionStorage.removeItem(CSRF_KEY)
}

export function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setUser(user) {
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  else sessionStorage.removeItem(USER_KEY)
}

export function clearSession() {
  setToken('')
  setUser(null)
  setCsrf('')
}

/** Always refresh when force=true so header matches HttpOnly cookie */
export async function ensureCsrf(force = false) {
  if (!force && getCsrf()) return getCsrf()
  const res = await fetch(apiUrl('/api/auth/csrf'), { credentials: 'include' })
  const json = await res.json()
  if (json?.data?.csrfToken) setCsrf(json.data.csrfToken)
  return getCsrf()
}

export async function apiFetch(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }
  const method = (options.method || 'GET').toUpperCase()
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const mutating = method !== 'GET' && method !== 'HEAD'
  if (mutating) {
    await ensureCsrf(true)
    headers['X-CSRF-Token'] = getCsrf()
  }

  const doFetch = () =>
    fetch(apiUrl(path), {
      ...options,
      headers,
      credentials: 'include',
    })

  let res = await doFetch()
  let json = await res.json().catch(() => ({ code: res.status, msg: res.statusText }))

  // Cookie/header drift (e.g. another tab refreshed CSRF) — retry once
  if (mutating && res.status === 403 && /csrf/i.test(String(json.msg || ''))) {
    await ensureCsrf(true)
    headers['X-CSRF-Token'] = getCsrf()
    res = await doFetch()
    json = await res.json().catch(() => ({ code: res.status, msg: res.statusText }))
  }

  return { res, json }
}

export function isLoggedIn() {
  return !!getToken()
}

export function loginUrl(redirectPath) {
  const redirect = encodeURIComponent(redirectPath || location.pathname + location.search)
  return `/pages/login.html?redirect=${redirect}`
}

export function registerUrl(redirectPath) {
  const redirect = encodeURIComponent(redirectPath || location.pathname + location.search)
  return `/pages/register.html?redirect=${redirect}`
}

export function consumeRedirect(defaultPath = '/pages/forum.html') {
  const params = new URLSearchParams(location.search)
  const redirect = params.get('redirect')
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return defaultPath
}

export function logout(redirect = '/pages/forum.html') {
  clearSession()
  location.href = redirect
}

export function qs(name) {
  return new URLSearchParams(location.search).get(name) || ''
}

export function memberUrl(idOrUsername) {
  if (idOrUsername == null || idOrUsername === '') return '/pages/forum.html'
  const s = String(idOrUsername)
  if (/^\d+$/.test(s)) return `/pages/user.html?id=${s}`
  return `/pages/user.html?u=${encodeURIComponent(s)}`
}
