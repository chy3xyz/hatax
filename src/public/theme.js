import { resolveDark, persistDark, toggleDark as toggleTheme } from '../theme.js'

/**
 * Alpine data for public pages — shares hatax_dark with admin.
 */
export function publicTheme() {
  const darkMode = resolveDark()
  persistDark(darkMode)
  return {
    darkMode,
    toggleDark() {
      this.darkMode = toggleTheme()
    },
    setDark(dark) {
      this.darkMode = !!dark
      persistDark(this.darkMode)
    },
  }
}
