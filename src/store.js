import { MENU_MAP, MENU_GROUPS } from './menu.js'
import { resolveDark, persistDark } from './theme.js'

export function registerAppStore(Alpine, htmx) {
  const _savedTabs = Alpine.storage ? Alpine.storage.get('tabs', null) : null
  const _savedSidebar = Alpine.storage ? Alpine.storage.get('sidebarOpen', null) : null
  const _savedActiveMenu = Alpine.storage ? Alpine.storage.get('activeMenu', null) : null
  const _dark = resolveDark()
  persistDark(_dark)

  Alpine.store('app', {
    dark: _dark,
    sidebarOpen: _savedSidebar !== null ? _savedSidebar : true,
    mobileMenuOpen: false,
    activeMenu: _savedActiveMenu || 'dashboard',
    tabs: _savedTabs && _savedTabs.length
      ? _savedTabs
      : [{ title: '首页', name: 'dashboard', active: true }],
    loading: false,
    breadcrumbs: [{ title: '首页', path: '/admin/dashboard.html' }],
    menuGroups: MENU_GROUPS,
    themeColor: Alpine.storage ? Alpine.storage.get('themeColor', '#1890ff') : '#1890ff',
    showTabs: Alpine.storage ? Alpine.storage.get('showTabs', true) : true,
    commandPaletteOpen: false,
    commandQuery: '',
    drawerOpen: false,
    settingOpen: false,
  
    init() {
      this.commandPaletteOpen = false
      // $watch not available on Alpine stores — use manual persistence via _persist() in methods
    },
  
    _persist() {
      if (Alpine.storage) {
        Alpine.storage.set('tabs', this.tabs)
        Alpine.storage.set('sidebarOpen', this.sidebarOpen)
        Alpine.storage.set('activeMenu', this.activeMenu)
      }
    },
  
    addTab(name, title) {
      const i18n = Alpine.store('i18n')
      const label = (i18n?.menuTitle?.(name, title) || title || name)
      const exist = this.tabs.find(t => t.name === name)
      if (!exist) this.tabs.push({ title: label, name, active: true })
      else exist.title = label
      this.tabs.forEach(t => t.active = t.name === name)
      this.activeMenu = name
      this._persist()
    },

    /** 切换语言后刷新侧栏相关标题（标签 / 面包屑） */
    relocalizeMenus() {
      const i18n = Alpine.store('i18n')
      if (!i18n?.menuTitle) return
      this.tabs = this.tabs.map((t) => ({
        ...t,
        title: i18n.menuTitle(t.name, t.title),
      }))
      const meta = MENU_MAP[this.activeMenu]
      if (meta?.breadcrumbs) {
        this.breadcrumbs = meta.breadcrumbs.map((b, i) => {
          if (i === 0 && meta.group) {
            const group = MENU_GROUPS.find((g) => g.title === meta.group || g.items.some((it) => it.name === this.activeMenu))
            if (group && b.path === '#') {
              return { ...b, title: i18n.menuTitle(group.name, b.title) }
            }
          }
          if (b.path && b.path !== '#') {
            const hit = Object.values(MENU_MAP).find((m) => m.path === b.path)
            const name = Object.keys(MENU_MAP).find((k) => MENU_MAP[k] === hit)
            if (name) return { ...b, title: i18n.menuTitle(name, b.title) }
          }
          return { ...b, title: i18n.menuTitle(this.activeMenu, b.title) }
        })
      }
      this._persist()
    },
  
    closeTab(index) {
      if (this.tabs.length <= 1) return
      const closedTab = this.tabs[index]
      this.tabs.splice(index, 1)
      if (closedTab.active && this.tabs.length) {
        this.tabs[0].active = true
        this.activeMenu = this.tabs[0].name
        const url = `/admin/${this.tabs[0].name}.html`
        this._navigateTo(url, this.tabs[0].title)
      }
      this._persist()
    },
  
    closeTabsLeftOf(index) {
      const keep = this.tabs.slice(index)
      if (keep.length === 0) return
      this.tabs = keep
      if (!this.tabs.find(t => t.active)) {
        this.tabs[0].active = true
        this.activeMenu = this.tabs[0].name
        const url = `/admin/${this.tabs[0].name}.html`
        this._navigateTo(url, this.tabs[0].title)
      }
      this._persist()
    },
  
    closeTabsRightOf(index) {
      const keep = this.tabs.slice(0, index + 1)
      if (keep.length === 0) return
      this.tabs = keep
      if (!this.tabs.find(t => t.active)) {
        this.tabs[this.tabs.length - 1].active = true
        this.activeMenu = this.tabs[this.tabs.length - 1].name
        const url = `/admin/${this.tabs[this.tabs.length - 1].name}.html`
        this._navigateTo(url, this.tabs[this.tabs.length - 1].title)
      }
      this._persist()
    },
  
    closeAllTabs() {
      const home = Alpine.store('i18n')?.menuTitle?.('dashboard', '首页') || '首页'
      this.tabs = [{ title: home, name: 'dashboard', active: true }]
      this.activeMenu = 'dashboard'
      this._navigateTo('/admin/dashboard.html', home)
      this._persist()
    },
  
    navigate(item) {
      const i18n = Alpine.store('i18n')
      const title = i18n?.menuTitle?.(item.name, item.title) || item.title
      const meta = MENU_MAP[item.name] || {}
      this.addTab(item.name, title)
      this.breadcrumbs = (meta.breadcrumbs || [{ title, path: item.path }]).map((b) => {
        if (b.path === '#' && meta.group) {
          const group = MENU_GROUPS.find((g) => g.title === meta.group)
          return { ...b, title: i18n?.menuTitle?.(group?.name, b.title) || b.title }
        }
        if (b.path && b.path !== '#') {
          const name = Object.keys(MENU_MAP).find((k) => MENU_MAP[k].path === b.path)
          if (name) return { ...b, title: i18n?.menuTitle?.(name, b.title) || b.title }
        }
        return { ...b, title: i18n?.menuTitle?.(item.name, b.title) || b.title }
      })
      this._navigateTo(item.path, title)
    },
  
    _navigateTo(url, title) {
      const target = document.getElementById('page-content')
      if (!target) { location.href = url; return }
      this.loading = true
      htmx.ajax('GET', url, {
        target: '#page-content',
        select: '#page-content',
        swap: 'outerHTML'
      })
      try { history.pushState({ url }, title || '', url) } catch(e) {}
    },
  
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs
    },
  
    setThemeColor(color) {
      this.themeColor = color
      document.documentElement.style.setProperty('--primary', color)
      if (Alpine.storage) Alpine.storage.set('themeColor', color)
    },
  
    toggleDark() {
      this.dark = !this.dark
      persistDark(this.dark)
    },
    setDarkMode(dark) {
      const next = !!dark
      if (this.dark === next) {
        persistDark(next)
        return
      }
      this.dark = next
      persistDark(next)
    },
  
    openCommandPalette() {
      this.commandPaletteOpen = true
      this.commandQuery = ''
      this.$nextTick(() => document.getElementById('cmd-input')?.focus())
    },
  
    closeCommandPalette() {
      this.commandPaletteOpen = false
    }
  })
  
  window._pageRefreshFns = {}
  window._registerPageRefresh = (name, fn) => { window._pageRefreshFns[name] = fn }
  window.refreshPage = () => {
    const name = location.pathname.replace('/admin/', '').replace('.html', '')
    Alpine.store('app')._persist()
    const fn = window._pageRefreshFns[name]
    if (fn) {
      Alpine.store('app').loading = true
      fn()
      Alpine.store('app').loading = false
    } else {
      Alpine.store('app').loading = true
      setTimeout(() => {
        Alpine.store('app').loading = false
        Alpine.notify.success(Alpine.store('i18n').t('notify.refreshed'))
      }, 400)
    }
  }
}
