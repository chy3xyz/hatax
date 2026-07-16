import { MENU_GROUPS } from './menu.js'
import { I18N_MESSAGES } from './i18n.js'

function focusFirst(el) {
  const focusable = el?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  focusable?.focus()
}

export function registerComponents(Alpine) {
  Alpine.data('modal', () => ({
    open: false,
    title: '',
    size: 'md',
    _prevFocus: null,
    openModal(title = '弹窗', size = 'md') {
      this._prevFocus = document.activeElement
      this.title = title
      this.size = size
      this.open = true
      document.body.style.overflow = 'hidden'
      this.$nextTick(() => focusFirst(this.$root))
    },
    closeModal() {
      this.open = false
      document.body.style.overflow = ''
      this._prevFocus?.focus?.()
    },
  }))

  Alpine.data('drawer', () => ({
    open: false,
    title: '',
    placement: 'right',
    size: 420,
    _prevFocus: null,
    openDrawer(title = '抽屉', placement = 'right', size = 420) {
      this._prevFocus = document.activeElement
      this.title = title
      this.placement = placement
      this.size = size
      this.open = true
      document.body.style.overflow = 'hidden'
      this.$nextTick(() => focusFirst(this.$root))
    },
    closeDrawer() {
      this.open = false
      document.body.style.overflow = ''
      this._prevFocus?.focus?.()
    },
  }))
  
  Alpine.data('formRule', () => ({
    fieldVal: '', errMsg: '',
    checkRequired(val, tip = '此项为必填') {
      if (!val || val.trim() === '') { this.errMsg = tip; return false }
      this.errMsg = ''; return true
    }
  }))
  
  Alpine.data('iconPicker', () => ({
    open: false, selected: '', filtered: [],
    icons: [
      'home', 'user', 'users', 'cog', 'chart-bar', 'chart-pie', 'document',
      'folder', 'mail', 'bell', 'search', 'menu', 'plus', 'x', 'check',
      'pencil', 'trash', 'eye', 'lock', 'unlock', 'key', 'shield',
      'star', 'heart', 'flag', 'tag', 'currency-dollar', 'shopping-cart',
      'camera', 'image', 'video', 'play', 'clock', 'calendar', 'map',
      'phone', 'computer', 'wifi', 'battery', 'sun', 'moon', 'cloud',
      'download', 'upload', 'link', 'share', 'settings', 'refresh', 'filter'
    ],
    filterIcons() {
      const q = this.selected.toLowerCase()
      this.filtered = this.icons.filter(i => i.includes(q))
    },
    pick(icon) {
      this.selected = icon
      this.$dispatch('icon-picked', icon)
      this.open = false
    }
  }))
  
  

  Alpine.data('settingDrawer', () => ({
    open: false,
    customColor: '#1890ff',
    themeColors: [
      { name: '拂晓蓝', color: '#1890ff', key: 'default' },
      { name: '火山红', color: '#ff4d4f', key: 'volcano' },
      { name: '日暮金', color: '#faad14', key: 'gold' },
      { name: '极客绿', color: '#52c41a', key: 'green' },
      { name: '紫罗兰', color: '#722ed1', key: 'purple' },
      { name: '粉晶色', color: '#eb2f96', key: 'pink' },
      { name: '深空灰', color: '#1f1f1f', key: 'dark' },
      { name: '极客蓝', color: '#1677ff', key: 'geek' },
    ],
    sidebarFixed: true,
    sidebarToggle: true,
    sidebarWidth: 256,
    transitionDuration: 300,
    transitionType: 'fade',
    showTabs: true,
    tabPersist: true,
    fixedHeader: true,
    fixedFooter: false,
    init() {
      this.sidebarFixed = Alpine.storage ? Alpine.storage.get('sidebarFixed', true) : true
      this.sidebarToggle = Alpine.storage ? Alpine.storage.get('sidebarToggle', true) : true
      this.sidebarWidth = Alpine.storage ? Alpine.storage.get('sidebarWidth', 256) : 256
      this.transitionDuration = Alpine.storage ? Alpine.storage.get('transitionDuration', 300) : 300
      this.transitionType = Alpine.storage ? Alpine.storage.get('transitionType', 'fade') : 'fade'
      this.showTabs = Alpine.storage ? Alpine.storage.get('showTabs', true) : true
      this.tabPersist = Alpine.storage ? Alpine.storage.get('tabPersist', true) : true
      this.fixedHeader = Alpine.storage ? Alpine.storage.get('fixedHeader', true) : true
      this.fixedFooter = Alpine.storage ? Alpine.storage.get('fixedFooter', false) : false
      this.customColor = Alpine.store('app').themeColor
    },
    openDrawer() {
      this.customColor = Alpine.store('app').themeColor
      this.open = true
      document.body.style.overflow = 'hidden'
    },
    closeDrawer() {
      this.open = false
      document.body.style.overflow = ''
    },
    setThemeColor(color, key = 'custom') {
      Alpine.store('app').setThemeColor(color)
      Alpine.storage && Alpine.storage.set('themeColorKey', key)
      this.customColor = color
    },
    toggleSystemTheme() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark && !Alpine.store('app').dark) Alpine.store('app').toggleDark()
      else if (!prefersDark && Alpine.store('app').dark) Alpine.store('app').toggleDark()
      Alpine.notify.info('已跟随系统主题')
    },
    applySettings() {
      if (Alpine.storage) {
        Alpine.storage.set('sidebarFixed', this.sidebarFixed)
        Alpine.storage.set('sidebarToggle', this.sidebarToggle)
        Alpine.storage.set('sidebarWidth', this.sidebarWidth)
        Alpine.storage.set('transitionDuration', this.transitionDuration)
        Alpine.storage.set('transitionType', this.transitionType)
        Alpine.storage.set('showTabs', this.showTabs)
        Alpine.storage.set('tabPersist', this.tabPersist)
        Alpine.storage.set('fixedHeader', this.fixedHeader)
        Alpine.storage.set('fixedFooter', this.fixedFooter)
      }
      // Sync live settings to global store
      Alpine.store('app').showTabs = this.showTabs
      document.documentElement.style.setProperty('--transition-duration', this.transitionDuration + 'ms')
      Alpine.notify.success('设置已保存')
    },
    resetSettings() {
      const defaults = {
        sidebarFixed: true, sidebarToggle: true, sidebarWidth: 256,
        transitionDuration: 300, transitionType: 'fade', showTabs: true,
        tabPersist: true, fixedHeader: true, fixedFooter: false
      }
      Object.assign(this, defaults)
      Alpine.store('app').setThemeColor('#1890ff')
      Alpine.storage && Alpine.storage.remove('themeColorKey')
      this.customColor = '#1890ff'
      document.documentElement.style.setProperty('--transition-duration', '300ms')
      Alpine.notify.success('已恢复默认设置')
    }
  }))

  Alpine.data('commandPalette', () => ({
    query: '',
    results: [],
    init() {
      try {
        this.getResults()
      } catch (e) {
        console.error('commandPalette init error:', e.message)
      }
    },
    getResults() {
      const i18n = Alpine.store('i18n')
      const withLabel = (items) =>
        items.map((i) => ({
          ...i,
          title: i18n?.menuTitle?.(i.name, i.title) || i.title,
        }))
      if (!this.query.trim()) {
        this.results = withLabel(MENU_GROUPS.flatMap((g) => g.items).slice(0, 6))
        return
      }
      const q = this.query.toLowerCase()
      this.results = withLabel(
        MENU_GROUPS.flatMap((g) => g.items).filter((i) => {
          const zh = I18N_MESSAGES.zh?.menu?.[i.name] || i.title
          const en = I18N_MESSAGES.en?.menu?.[i.name] || ''
          return (
            i.title.toLowerCase().includes(q) ||
            i.name.includes(q) ||
            String(zh).toLowerCase().includes(q) ||
            String(en).toLowerCase().includes(q)
          )
        }),
      )
    },
    navigate(item) {
      Alpine.store('app').navigate(item)
      Alpine.store('app').commandPaletteOpen = false
    },
  }))
}
