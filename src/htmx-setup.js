import { clearToken, loginRedirectUrl } from './auth.js'
import { apiUrl, API_BASE } from './api-base.js'

const CSRF_META = 'csrf-token'
const CSRF_STORAGE = 'hatax_csrf'

export function getCsrfToken() {
  return (
    document.querySelector(`meta[name="${CSRF_META}"]`)?.content ||
    sessionStorage.getItem(CSRF_STORAGE) ||
    ''
  )
}

export function setCsrfToken(token) {
  if (!token) return
  sessionStorage.setItem(CSRF_STORAGE, token)
  let meta = document.querySelector(`meta[name="${CSRF_META}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = CSRF_META
    document.head.appendChild(meta)
  }
  meta.content = token
}

/** Fetch CSRF cookie + token (public) */
export async function ensureCsrf() {
  try {
    const res = await fetch(apiUrl('/api/auth/csrf'), { credentials: 'include' })
    const json = await res.json()
    if (json?.data?.csrfToken) setCsrfToken(json.data.csrfToken)
  } catch {
    /* offline / API down */
  }
}

/**
 * Global HTMX config: loading indicator, CSRF header, 401 handling.
 */
export function setupHtmx(htmx, Alpine) {
  htmx.config.historyEnabled = false
  htmx.config.globalViewTransitions = true
  htmx.config.withCredentials = true

  htmx.on('htmx:configRequest', (evt) => {
    const path = evt.detail.path
    if (API_BASE && typeof path === 'string' && path.startsWith('/api/')) {
      evt.detail.path = apiUrl(path)
    }
    const token = sessionStorage.getItem('hatax_token')
    if (token) {
      evt.detail.headers['Authorization'] = `Bearer ${token}`
    }
    const csrf = getCsrfToken()
    if (csrf) {
      evt.detail.headers['X-CSRF-Token'] = csrf
    }
  })

  htmx.on('htmx:beforeRequest', () => {
    try {
      Alpine.store('app').loading = true
    } catch {
      /* store not ready */
    }
  })

  htmx.on('htmx:afterSettle', () => {
    try {
      Alpine.store('app').loading = false
    } catch {
      /* ignore */
    }
  })

  htmx.on('htmx:responseError', (evt) => {
    try {
      Alpine.store('app').loading = false
    } catch {
      /* ignore */
    }
    const xhr = evt.detail?.xhr
    if (xhr?.status === 401) {
      clearToken()
      location.replace(loginRedirectUrl())
      return
    }
    const msg = Alpine.store('i18n')?.t('notify.requestFailed') || 'Request failed'
    Alpine.notify?.error(msg)
  })

  htmx.on('htmx:sendError', () => {
    try {
      Alpine.store('app').loading = false
    } catch {
      /* ignore */
    }
    Alpine.notify?.error(
      Alpine.store('i18n')?.t('notify.pageLoadFailed') || 'Page load failed',
    )
  })

  htmx.on('htmx:beforeSwap', (evt) => {
    const xhr = evt.detail?.xhr
    if (xhr?.status === 401) {
      evt.detail.shouldSwap = false
      clearToken()
      location.replace(loginRedirectUrl())
    }
  })
}
