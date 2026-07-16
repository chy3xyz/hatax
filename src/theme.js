/**
 * Shared theme helpers — key must match Alpine.storage (`hatax_dark`).
 * Used by admin store and public pages.
 */
export const THEME_STORAGE_KEY = 'hatax_dark'

export function readStoredDark() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw != null) return JSON.parse(raw) === true
  } catch {
    /* ignore */
  }
  return null
}

/** Prefer stored preference; otherwise system prefers-color-scheme */
export function resolveDark() {
  const stored = readStoredDark()
  if (stored !== null) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyDarkClass(dark) {
  document.documentElement.classList.toggle('dark', !!dark)
}

export function persistDark(dark) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(!!dark))
  } catch {
    /* quota / private mode */
  }
  applyDarkClass(dark)
}

export function toggleDark() {
  const next = !document.documentElement.classList.contains('dark')
  persistDark(next)
  return next
}
