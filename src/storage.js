/** localStorage helpers with hatax_ prefix */
export function createStorage() {
  return {
    get(key, defaultVal = null) {
      try {
        const v = localStorage.getItem(`hatax_${key}`)
        return v ? JSON.parse(v) : defaultVal
      } catch {
        return defaultVal
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(`hatax_${key}`, JSON.stringify(val))
      } catch { /* quota / private mode */ }
    },
    remove(key) {
      try {
        localStorage.removeItem(`hatax_${key}`)
      } catch { /* ignore */ }
    },
  }
}

export function attachStorage(Alpine) {
  Alpine.storage = createStorage()
}
