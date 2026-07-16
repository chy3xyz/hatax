/** API origin — empty = same-origin (Vite proxy / production Hono static) */
export const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : ''

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}
