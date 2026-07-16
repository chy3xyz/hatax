import './style.css'
import Alpine from 'alpinejs'
import htmx from 'htmx.org'
import { attachStorage } from './src/storage.js'
import { registerI18n } from './src/i18n.js'
import { registerAppStore } from './src/store.js'
import { registerNotify } from './src/notify.js'
import { registerComponents } from './src/components.js'
import { registerDemoPages } from './src/admin/demo-pages.js'
import { registerApiPages } from './src/admin/api-pages.js'
import { registerUserForm } from './src/admin/user-form.js'
import { registerContentPages } from './src/admin/content-pages.js'
import { setupHtmx, ensureCsrf } from './src/htmx-setup.js'
import { requireAuth } from './src/auth.js'
import { MENU_MAP, MENU_GROUPS } from './src/menu.js'

export { MENU_MAP, MENU_GROUPS }

window.htmx = htmx

attachStorage(Alpine)
registerI18n(Alpine)
registerNotify(Alpine)
registerAppStore(Alpine, htmx)
registerComponents(Alpine)
registerDemoPages(Alpine)
registerApiPages(Alpine)
registerUserForm(Alpine)
registerContentPages(Alpine)
setupHtmx(htmx, Alpine)

// Auth gate — public pages skip; others redirect to login
if (!requireAuth()) {
  // Stop boot on protected pages without token (redirect already issued)
} else {
  ensureCsrf().finally(() => bootApp(Alpine, htmx))
}

function bootApp(Alpine, htmx) {
  // Sync html.dark with store (theme-boot already applied; avoid FOUC reverse)
  const dark = Alpine.store('app').dark
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.add('theme-ready')

  window.addEventListener('popstate', (e) => {
    if (e.state?.url) {
      const target = document.getElementById('page-content')
      if (target) {
        Alpine.store('app').loading = true
        htmx.ajax('GET', e.state.url, {
          target: '#page-content',
          select: '#page-content',
          swap: 'outerHTML',
        })
      }
    }
  })

  if (Alpine.store('app').dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  document.documentElement.style.setProperty(
    '--primary',
    Alpine.store('app').themeColor,
  )

  window.toggleFullscreen = function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      Alpine.store('app').openCommandPalette()
    }
    if (e.key === 'Escape') {
      Alpine.store('app').commandPaletteOpen = false
      Alpine.store('app').settingOpen = false
      Alpine.store('app').mobileMenuOpen = false
    }
  })

  window.Alpine = Alpine
  Alpine.start()

  Alpine.store('app').commandPaletteOpen = false
  Alpine.store('app').settingOpen = false
  Alpine.store('app').mobileMenuOpen = false
}
