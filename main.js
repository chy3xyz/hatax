import './style.css'
import Alpine from 'alpinejs'
import htmx from 'htmx.org'
import { getAddress, connectWallet, disconnectWallet, switchChain, getCurrentChain, syncChainFromWallet, getChainDisplayName } from './web3/wallet.js'
import { addressBook } from './components/site/address-book.js'
window.htmx = htmx

htmx.config.historyEnabled = false
htmx.config.globalViewTransitions = true

htmx.on('htmx:beforeRequest', () => { Alpine.store('app').loading = true })
htmx.on('htmx:afterSettle', () => { Alpine.store('app').loading = false })
htmx.on('htmx:error', (evt) => {
  Alpine.store('app').loading = false
  Alpine.notify.error(Alpine.store('i18n').t('notify.pageLoadFailed'))
})

// Browser back/forward — reload content via HTMX
window.addEventListener('popstate', (e) => {
  if (e.state?.url) {
    const target = document.getElementById('page-content')
    if (target) {
      Alpine.store('app').loading = true
      htmx.ajax('GET', e.state.url, {
        target: '#page-content',
        select: '#page-content',
        swap: 'outerHTML'
      })
    }
  }
})

// ========== ALPINE STORAGE ==========
Alpine.storage = {
  get(key, defaultVal = null) {
    try {
      const v = localStorage.getItem(`hatax_${key}`)
      return v ? JSON.parse(v) : defaultVal
    } catch { return defaultVal }
  },
  set(key, val) {
    try { localStorage.setItem(`hatax_${key}`, JSON.stringify(val)) } catch {}
  },
  remove(key) { try { localStorage.removeItem(`hatax_${key}`) } catch {} }
}

// ========== I18N ==========
import { I18N_MESSAGES, LOCALES, LOCALE_LABELS } from './i18n.js'

Alpine.store('i18n', {
  locale: Alpine.storage ? Alpine.storage.get('locale', 'zh') : 'zh',
  init() { document.documentElement.lang = this.locale },
  t(key) {
    const keys = key.split('.')
    let msg = I18N_MESSAGES[this.locale] || I18N_MESSAGES.zh
    for (const k of keys) { if (!msg) return key; msg = msg[k] }
    return msg || key
  },
  setLocale(locale) {
    this.locale = locale
    document.documentElement.lang = locale
    if (Alpine.storage) Alpine.storage.set('locale', locale)
  },
  toggleLocale() {
    const idx = LOCALES.indexOf(this.locale)
    this.setLocale(LOCALES[(idx + 1) % LOCALES.length])
  },
  get localeLabel() { return LOCALE_LABELS[this.locale] || this.locale },
  get locales() { return LOCALES },
  get localeLabels() { return LOCALE_LABELS },
})

// ========== MENU MAP & GROUPS ==========
export const MENU_MAP = {
  'dashboard': { group: '主菜单', title: '首页', path: '/pages/admin/dashboard.html', breadcrumbs: [{ title: '首页', path: '/pages/admin/dashboard.html' }] },
  'user': { group: '系统管理', title: '用户管理', path: '/pages/admin/user.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '用户管理', path: '/pages/admin/user.html' }] },
  'role': { group: '系统管理', title: '角色权限', path: '/pages/admin/role.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '角色权限', path: '/pages/admin/role.html' }] },
  'menu': { group: '系统管理', title: '菜单管理', path: '/pages/admin/menu.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '菜单管理', path: '/pages/admin/menu.html' }] },
  'dept': { group: '系统管理', title: '部门管理', path: '/pages/admin/dept.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '部门管理', path: '/pages/admin/dept.html' }] },
  'dict': { group: '系统管理', title: '字典管理', path: '/pages/admin/dict.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '字典管理', path: '/pages/admin/dict.html' }] },
  'login-log': { group: '系统管理', title: '登录日志', path: '/pages/admin/login-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '登录日志', path: '/pages/admin/login-log.html' }] },
  'op-log': { group: '系统管理', title: '操作日志', path: '/pages/admin/op-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '操作日志', path: '/pages/admin/op-log.html' }] },
  'form-basic': { group: '表单页', title: '基础表单', path: '/pages/admin/form-basic.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '基础表单', path: '/pages/admin/form-basic.html' }] },
  'form-advanced': { group: '表单页', title: '高级表单', path: '/pages/admin/form-advanced.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '高级表单', path: '/pages/admin/form-advanced.html' }] },
  'table': { group: '列表页', title: '表格列表', path: '/pages/admin/table.html', breadcrumbs: [{ title: '列表页', path: '#' }, { title: '表格列表', path: '/pages/admin/table.html' }] },
  'profile': { group: '个人页', title: '个人中心', path: '/pages/admin/profile.html', breadcrumbs: [{ title: '个人中心', path: '/pages/admin/profile.html' }] },
  'about': { group: '其他', title: '关于', path: '/pages/admin/about.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: '关于', path: '/pages/admin/about.html' }] },
  'ai-chat': { group: '其他', title: 'AI 助手', path: '/pages/admin/ai-chat.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: 'AI 助手', path: '/pages/admin/ai-chat.html' }] },
  'order-management': { group: '电商管理', title: '订单管理', path: '/pages/admin/order-management.html', breadcrumbs: [{ title: '电商管理', path: '#' }, { title: '订单管理', path: '/pages/admin/order-management.html' }] },
  'product-registry': { group: '电商管理', title: '产品入驻', path: '/pages/admin/product-registry.html', breadcrumbs: [{ title: '电商管理', path: '#' }, { title: '产品入驻', path: '/pages/admin/product-registry.html' }] },
  'dapp-home': { group: '33buy', title: '首页', path: '/pages/site/index.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '首页', path: '/pages/site/index.html' }] },
  'dapp-products': { group: '33buy', title: '产品', path: '/pages/site/products.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '产品', path: '/pages/site/products.html' }] },
  'dapp-me': { group: '33buy', title: '我的', path: '/pages/site/me.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '我的', path: '/pages/site/me.html' }] },
  'dapp-ming': { group: '33buy', title: '合成挖矿', path: '/pages/site/dapp-ming.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '合成挖矿', path: '/pages/site/dapp-ming.html' }] },
  'dapp-mings': { group: '33buy', title: '单币挖矿', path: '/pages/site/dapp-mings.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '单币挖矿', path: '/pages/site/dapp-mings.html' }] },
  'dapp-nft': { group: '33buy', title: 'NFT', path: '/pages/site/dapp-nft.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: 'NFT', path: '/pages/site/dapp-nft.html' }] },
  'dapp-redpacket': { group: '33buy', title: '红包', path: '/pages/site/dapp-redpacket.html', breadcrumbs: [{ title: '33buy', path: '#' }, { title: '红包', path: '/pages/site/dapp-redpacket.html' }] },
}

export const MENU_GROUPS = [
  {
    title: '主菜单', items: [
      { name: 'dashboard', title: '首页', path: '/pages/admin/dashboard.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
    ]
  },
  {
    title: '系统管理', items: [
      { name: 'user', title: '用户管理', path: '/pages/admin/user.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H9v-1a3 3 0 016 0v1zm0 0h6v-1a9 9 0 00-18 0v1h6"></path></svg>' },
      { name: 'role', title: '角色权限', path: '/pages/admin/role.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>' },
      { name: 'menu', title: '菜单管理', path: '/pages/admin/menu.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>' },
      { name: 'dept', title: '部门管理', path: '/pages/admin/dept.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>' },
      { name: 'dict', title: '字典管理', path: '/pages/admin/dict.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
    ]
  },
  {
    title: '日志审计', items: [
      { name: 'login-log', title: '登录日志', path: '/pages/admin/login-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' },
      { name: 'op-log', title: '操作日志', path: '/pages/admin/op-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
    ]
  },
  {
    title: '表单页', items: [
      { name: 'form-basic', title: '基础表单', path: '/pages/admin/form-basic.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
      { name: 'form-advanced', title: '高级表单', path: '/pages/admin/form-advanced.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
    ]
  },
  {
    title: '列表页', items: [
      { name: 'table', title: '表格列表', path: '/pages/admin/table.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' },
    ]
  },
  {
    title: '个人页', items: [
      { name: 'profile', title: '个人中心', path: '/pages/admin/profile.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' },
    ]
  },
  {
    title: '其他', items: [
      { name: 'ai-chat', title: 'AI 助手', path: '/pages/admin/ai-chat.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' },
      { name: 'about', title: '关于', path: '/pages/admin/about.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
    ]
  },
  {
    title: '电商管理', items: [
      { name: 'order-management', title: '订单管理', path: '/pages/admin/order-management.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>' },
      { name: 'product-registry', title: '产品入驻', path: '/pages/admin/product-registry.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>' },
    ]
  },
  {
    title: '33buy', items: [
      { name: 'dapp-home', title: '首页', path: '/pages/site/index.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
      { name: 'dapp-products', title: '产品', path: '/pages/site/products.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>' },
      { name: 'dapp-me', title: '我的', path: '/pages/site/me.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' },
      { name: 'dapp-nft', title: 'NFT', path: '/pages/site/dapp-nft.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' },
    ]
  },
]

// ========== THEME COLORS ==========
export const THEME_COLORS = [
  { name: '拂晓蓝', color: '#1890ff', key: 'default' },
  { name: '火山红', color: '#ff4d4f', key: 'volcano' },
  { name: '日暮金', color: '#faad14', key: 'gold' },
  { name: '极客绿', color: '#52c41a', key: 'green' },
  { name: '紫罗兰', color: '#722ed1', key: 'purple' },
  { name: '粉晶色', color: '#eb2f96', key: 'pink' },
  { name: '深空灰', color: '#1f1f1f', key: 'dark' },
]

// ========== ALPINE APP STORE ==========
const _savedTabs = Alpine.storage ? Alpine.storage.get('tabs', null) : null
const _savedSidebar = Alpine.storage ? Alpine.storage.get('sidebarOpen', null) : null
const _savedActiveMenu = Alpine.storage ? Alpine.storage.get('activeMenu', null) : null

Alpine.store('app', {
  dark: Alpine.storage ? Alpine.storage.get('dark', false) : false,
  sidebarOpen: _savedSidebar !== null ? _savedSidebar : true,
  mobileMenuOpen: false,
  activeMenu: _savedActiveMenu || 'dashboard',
  tabs: _savedTabs && _savedTabs.length
    ? _savedTabs
    : [{ title: '首页', name: 'dashboard', active: true }],
  loading: false,
  breadcrumbs: [{ title: '首页', path: '/pages/admin/dashboard.html' }],
  menuGroups: MENU_GROUPS,
  themeColor: Alpine.storage ? Alpine.storage.get('themeColor', '#1890ff') : '#1890ff',
  showTabs: Alpine.storage ? Alpine.storage.get('showTabs', true) : true,
  commandPaletteOpen: false,
  commandQuery: '',
  drawerOpen: false,
  settingOpen: false,
  walletAddress: getAddress() ? getAddress().toLowerCase() : null,
  walletConnecting: false,
  currentChainName: getChainDisplayName(getCurrentChain()),

  init() {
    this.commandPaletteOpen = false
    // Listen for wallet chain changes and update UI
    window.addEventListener('wallet-chain-changed', (e) => {
      this.currentChainName = e.detail.displayName || e.detail.name
      // Follow the wallet: refresh chain-dependent data by reloading when the chain actually changes.
      // Use sessionStorage to avoid a reload loop on page init.
      const lastChainId = sessionStorage.getItem('__33buy_last_chain_id__')
      const newChainId = String(e.detail.id)
      if (document.visibilityState !== 'hidden' && lastChainId && lastChainId !== newChainId) {
        sessionStorage.setItem('__33buy_last_chain_id__', newChainId)
        window.location.reload()
      } else {
        sessionStorage.setItem('__33buy_last_chain_id__', newChainId)
      }
    })
    // Listen for wallet account changes (MetaMask switch account)
    window.addEventListener('wallet-account-changed', (e) => {
      const newAddr = e.detail ? e.detail.toLowerCase() : null
      const current = this.walletAddress
      // Ignore case-only changes to prevent duplicate reloads / modal reopening
      if (newAddr === current) return
      this.walletAddress = newAddr
      if (!newAddr) {
        this.currentChainName = getChainDisplayName(getCurrentChain())
      }
    })
    // Sync chain on startup if wallet was previously connected
    if (this.walletAddress) {
      syncChainFromWallet().catch(() => {})
    }
  },

  _persist() {
    if (Alpine.storage) {
      Alpine.storage.set('tabs', this.tabs)
      Alpine.storage.set('sidebarOpen', this.sidebarOpen)
      Alpine.storage.set('activeMenu', this.activeMenu)
    }
  },

  addTab(name, title) {
    const exist = this.tabs.find(t => t.name === name)
    if (!exist) this.tabs.push({ title, name, active: true })
    this.tabs.forEach(t => t.active = t.name === name)
    this.activeMenu = name
    this._persist()
  },

  closeTab(index) {
    if (this.tabs.length <= 1) return
    const closedTab = this.tabs[index]
    this.tabs.splice(index, 1)
    if (closedTab.active && this.tabs.length) {
      this.tabs[0].active = true
      this.activeMenu = this.tabs[0].name
      const url = this._buildPath(this.tabs[0].name)
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
      const url = this._buildPath(this.tabs[0].name)
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
      const url = this._buildPath(this.tabs[this.tabs.length - 1].name)
      this._navigateTo(url, this.tabs[this.tabs.length - 1].title)
    }
    this._persist()
  },

  closeAllTabs() {
    this.tabs = [{ title: '首页', name: 'dashboard', active: true }]
    this.activeMenu = 'dashboard'
    this._navigateTo('/pages/admin/dashboard.html', '首页')
    this._persist()
  },

  navigate(item) {
    const meta = MENU_MAP[item.name] || {}
    this.addTab(item.name, item.title)
    this.breadcrumbs = meta.breadcrumbs || [{ title: item.title, path: item.path }]
    this._navigateTo(item.path, item.title)
  },

  _buildPath(name) {
    // Site pages: dapp-* prefix → /pages/site/
    if (name.startsWith('dapp-')) {
      // dapp-home → index.html, others → dapp-xxx.html
      const file = name === 'dapp-home' ? 'index' : name
      return `/pages/site/${file}.html`
    }
    // Admin pages: everything else → /pages/admin/
    return `/pages/admin/${name}.html`
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
    if (Alpine.storage) Alpine.storage.set('dark', this.dark)
  },
  setDarkMode(dark) {
    if (this.dark !== dark) this.toggleDark()
  },

  openCommandPalette() {
    this.commandPaletteOpen = true
    this.commandQuery = ''
    this.$nextTick(() => document.getElementById('cmd-input')?.focus())
  },

  closeCommandPalette() {
    this.commandPaletteOpen = false
  },

  async connectWallet() {
    this.walletConnecting = true
    try {
      const addr = await connectWallet()
      this.walletAddress = addr ? addr.toLowerCase() : null
      Alpine.notify.success(Alpine.store('i18n').t('site.walletConnected'))
    } catch (e) {
      Alpine.notify.error(e.message || 'Failed to connect wallet')
    } finally {
      this.walletConnecting = false
    }
  },

  disconnectWallet() {
    disconnectWallet()
    this.walletAddress = null
  },

  async switchToChain(chainKey) {
    try {
      await switchChain(chainKey)
      this.currentChainName = getChainDisplayName(getCurrentChain())
    } catch (e) {
      Alpine.notify.error(e.message || 'Failed to switch chain')
    }
  }
})

window._pageRefreshFns = {}
window._registerPageRefresh = (name, fn) => { window._pageRefreshFns[name] = fn }
window.refreshPage = () => {
  const name = location.pathname.replace('/pages/', '').replace('.html', '')
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

// ========== ALPINE COMPONENTS ==========
Alpine.data('addressBook', addressBook)

Alpine.data('modal', () => ({
  open: false, title: '', size: 'md',
  openModal(title = '弹窗', size = 'md') {
    this.title = title; this.size = size; this.open = true
    document.body.style.overflow = 'hidden'
  },
  closeModal() {
    this.open = false
    document.body.style.overflow = ''
  }
}))

Alpine.data('drawer', () => ({
  open: false, title: '', placement: 'right', size: 420,
  openDrawer(title = '抽屉', placement = 'right', size = 420) {
    this.title = title; this.placement = placement; this.size = size
    this.open = true
    document.body.style.overflow = 'hidden'
  },
  closeDrawer() {
    this.open = false
    document.body.style.overflow = ''
  }
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

// ========== ALPINE NOTIFY ==========
Alpine.notify = {
  container: null,
  init() {
    this.container = document.createElement('div')
    this.container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[99999] space-y-2.5 max-w-sm w-[calc(100%-2rem)]'
    document.body.appendChild(this.container)
  },
  create(type, content, opts = {}) {
    if (!this.container) this.init()
    const { duration = 3500, title = '' } = opts
    const cfg = {
      success: { bg: 'bg-white dark:bg-gray-800', border: 'border-l-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-500', bar: 'bg-emerald-500', icon: 'M5 13l4 4L19 7', title: Alpine.store('i18n').t('notify.success') },
      error:   { bg: 'bg-white dark:bg-gray-800', border: 'border-l-red-500',       iconBg: 'bg-red-50 dark:bg-red-900/30',    iconColor: 'text-red-500',    bar: 'bg-red-500',    icon: 'M6 18L18 6M6 6l12 12', title: Alpine.store('i18n').t('notify.error') },
      warning: { bg: 'bg-white dark:bg-gray-800', border: 'border-l-amber-500',    iconBg: 'bg-amber-50 dark:bg-amber-900/30',  iconColor: 'text-amber-500',  bar: 'bg-amber-500',  icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', title: Alpine.store('i18n').t('notify.warning') },
      info:    { bg: 'bg-white dark:bg-gray-800', border: 'border-l-blue-500',     iconBg: 'bg-blue-50 dark:bg-blue-900/30',   iconColor: 'text-blue-500',   bar: 'bg-blue-500',   icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: Alpine.store('i18n').t('notify.info') },
    }
    const c = cfg[type] || cfg.info
    const el = document.createElement('div')
    el.className = `notify-item ${c.bg} ${c.border} border-l-[3px] rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden transform opacity-0 -translate-y-2 scale-[0.97] transition-all duration-300 ease-out`
    el.innerHTML = `
      <div class="flex items-start gap-3 p-3.5">
        <div class="w-7 h-7 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg class="w-3.5 h-3.5 ${c.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${c.icon}"></path></svg>
        </div>
        <div class="flex-1 min-w-0 pt-0.5">
          <div class="font-semibold text-[13px] text-gray-900 dark:text-gray-100 leading-tight">${title || c.title}</div>
          <div class="text-[13px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">${content}</div>
        </div>
        <button class="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-0.5" @click="this.closest('.notify-item').remove()">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="h-[2px] bg-gray-100 dark:bg-gray-700">
        <div class="h-full ${c.bar} progress-bar" style="animation: notify-progress ${duration}ms linear forwards"></div>
      </div>`
    this.container.appendChild(el)
    requestAnimationFrame(() => { el.classList.remove('opacity-0', '-translate-y-2', 'scale-[0.97]') })
    const timer = setTimeout(() => this.remove(el), duration)
    el._timer = timer
  },
  remove(el) {
    if (!el || !el.parentNode) return
    clearTimeout(el._timer)
    el.classList.add('opacity-0', '-translate-y-1', 'scale-[0.97]')
    setTimeout(() => el.remove(), 300)
  },
  success(content, opts) { this.create('success', content, opts) },
  error(content, opts) { this.create('error', content, opts) },
  warning(content, opts) { this.create('warning', content, opts) },
  info(content, opts) { this.create('info', content, opts) },
}

// ========== ALPINE MESSAGE (alias) ==========
Alpine.message = Alpine.notify

// ========== CLIPBOARD HELPER (mobile-friendly fallback) ==========
Alpine.copyText = async function(text) {
  try {
    // Modern Clipboard API (requires secure context)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) { /* fall through */ }

  // Fallback for older / non-secure mobile browsers
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;'
    document.body.appendChild(ta)
    const range = document.createRange()
    range.selectNode(ta)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    selection.removeAllRanges()
    document.body.removeChild(ta)
    return ok
  } catch (e) {
    console.error('copy failed:', e)
    return false
  }
}

// ========== SETTING DRAWER COMPONENT ==========
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

// ========== LOGIN LOG PAGE ==========
Alpine.data('loginLogPage', () => ({
  keyword: '', filterStatus: 'All', filterDateStart: '', filterDateEnd: '',
  currentPage: 1, pageSize: 10,
  sortField: 'time', sortDir: 'desc',
  allData: [
    { id: 1, username: 'admin', time: '2024-12-01 09:23:15', ip: '192.168.1.101', location: 'Beijing', browser: 'Chrome 120', status: 'Success' },
    { id: 2, username: 'zhangwei', time: '2024-12-01 09:45:32', ip: '10.0.0.55', location: 'Shanghai', browser: 'Firefox 121', status: 'Success' },
    { id: 3, username: 'admin', time: '2024-12-01 10:12:08', ip: '192.168.1.101', location: 'Beijing', browser: 'Chrome 120', status: 'Failed' },
    { id: 4, username: 'lihua', time: '2024-12-01 11:05:44', ip: '172.16.0.23', location: 'Guangzhou', browser: 'Edge 120', status: 'Success' },
    { id: 5, username: 'wangfang', time: '2024-12-01 13:22:17', ip: '10.10.10.10', location: 'Shenzhen', browser: 'Safari 17', status: 'Success' },
    { id: 6, username: 'chenjie', time: '2024-12-01 14:08:53', ip: '192.168.2.88', location: 'Hangzhou', browser: 'Chrome 119', status: 'Failed' },
    { id: 7, username: 'zhaoli', time: '2024-12-01 15:33:21', ip: '10.20.30.40', location: 'Chengdu', browser: 'Chrome 120', status: 'Success' },
    { id: 8, username: 'admin', time: '2024-12-01 16:44:06', ip: '192.168.1.101', location: 'Beijing', browser: 'Chrome 120', status: 'Success' },
    { id: 9, username: 'sunmei', time: '2024-12-01 17:11:39', ip: '172.20.5.12', location: 'Wuhan', browser: 'Firefox 120', status: 'Success' },
    { id: 10, username: 'liuyang', time: '2024-12-01 18:27:14', ip: '10.50.60.70', location: 'Nanjing', browser: 'Chrome 121', status: 'Success' },
    { id: 11, username: 'zhangwei', time: '2024-12-01 19:05:58', ip: '10.0.0.55', location: 'Shanghai', browser: 'Firefox 121', status: 'Success' },
    { id: 12, username: 'admin', time: '2024-12-01 19:45:33', ip: '192.168.1.101', location: 'Beijing', browser: 'Chrome 120', status: 'Failed' },
    { id: 13, username: 'zhouyu', time: '2024-12-01 20:18:42', ip: '192.168.3.200', location: 'Xian', browser: 'Edge 120', status: 'Success' },
    { id: 14, username: 'huangli', time: '2024-12-01 21:02:15', ip: '10.80.90.100', location: 'Chongqing', browser: 'Chrome 120', status: 'Success' },
    { id: 15, username: 'lihua', time: '2024-12-02 08:30:07', ip: '172.16.0.23', location: 'Guangzhou', browser: 'Edge 120', status: 'Success' },
  ],
  get filtered() {
    let rows = this.allData.filter(r => {
      const matchKw = !this.keyword || r.username.toLowerCase().includes(this.keyword) || r.ip.includes(this.keyword)
      const matchStatus = this.filterStatus === 'All' || r.status === this.filterStatus
      return matchKw && matchStatus
    })
    const dir = this.sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[this.sortField], vb = b[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
    return rows
  },
  get paged() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filtered.slice(start, start + this.pageSize)
  },
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)) },
  get total() { return this.filtered.length },
  get statusClass() { return (s) => s === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' },
  toggleSort(field) {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    else { this.sortField = field; this.sortDir = 'asc' }
  },
  search() { this.currentPage = 1 },
  reset() { this.keyword = ''; this.filterStatus = 'All'; this.filterDateStart = ''; this.filterDateEnd = ''; this.currentPage = 1 },
  exportData() { Alpine.notify.success(Alpine.store('i18n').t('notify.exported') + ' ' + this.total + ' ' + Alpine.store('i18n').t('loginLog.title')) }
}))

// ========== OP LOG PAGE ==========
Alpine.data('opLogPage', () => ({
  keyword: '', filterModule: 'All', filterAction: 'All', filterStatus: 'All',
  filterDateStart: '', filterDateEnd: '',
  currentPage: 1, pageSize: 10,
  sortField: 'time', sortDir: 'desc',
  allData: [
    { id: 1, operator: 'admin', module: '用户管理', action: '编辑', detail: '修改用户 张伟 的角色为运营主管', ip: '192.168.1.101', time: '2024-12-01 10:23:15', duration: 120, status: 'Success' },
    { id: 2, operator: 'admin', module: '角色权限', action: '编辑', detail: '更新超级管理员权限配置', ip: '192.168.1.101', time: '2024-12-01 10:45:32', duration: 450, status: 'Success' },
    { id: 3, operator: 'admin', module: '菜单管理', action: '新增', detail: '新增菜单项：数据分析', ip: '192.168.1.101', time: '2024-12-01 11:12:08', duration: 80, status: 'Success' },
    { id: 4, operator: 'zhangwei', module: '表单管理', action: '提交', detail: '提交高级表单申请单据', ip: '10.0.0.55', time: '2024-12-01 13:05:44', duration: 200, status: 'Success' },
    { id: 5, operator: 'lihua', module: '数据导出', action: '导出', detail: '导出用户数据 Excel', ip: '172.16.0.23', time: '2024-12-01 14:22:17', duration: 12000, status: 'Success' },
    { id: 6, operator: 'admin', module: '系统配置', action: '编辑', detail: '修改主题色为火山红', ip: '192.168.1.101', time: '2024-12-01 15:08:53', duration: 45, status: 'Success' },
    { id: 7, operator: 'wangfang', module: '菜单管理', action: '删除', detail: '删除菜单项：临时页面', ip: '10.10.10.10', time: '2024-12-01 15:33:21', duration: 60, status: 'Success' },
    { id: 8, operator: 'chenjie', module: '用户管理', action: '新增', detail: '新增用户 李娜', ip: '192.168.2.88', time: '2024-12-01 16:44:06', duration: 150, status: 'Success' },
    { id: 9, operator: 'admin', module: '数据备份', action: '备份', detail: '执行数据库完整备份', ip: '192.168.1.101', time: '2024-12-01 17:11:39', duration: 45000, status: 'Warning' },
    { id: 10, operator: 'zhaoli', module: '角色权限', action: '删除', detail: '删除角色：测试角色', ip: '10.20.30.40', time: '2024-12-01 18:27:14', duration: 90, status: 'Success' },
    { id: 11, operator: 'sunmei', module: '表单管理', action: '提交', detail: '提交采购申请单', ip: '172.20.5.12', time: '2024-12-01 19:05:58', duration: 180, status: 'Success' },
    { id: 12, operator: 'liuyang', module: '数据导入', action: '导入', detail: '批量导入用户数据 CSV', ip: '10.50.60.70', time: '2024-12-01 20:18:42', duration: 8000, status: 'Error' },
    { id: 13, operator: 'admin', module: '系统配置', action: '编辑', detail: '修改系统超时时间为 30 分钟', ip: '192.168.1.101', time: '2024-12-01 21:02:15', duration: 35, status: 'Success' },
    { id: 14, operator: 'zhouyu', module: '部门管理', action: '新增', detail: '新增部门：成都分公司', ip: '192.168.3.200', time: '2024-12-02 08:30:07', duration: 110, status: 'Success' },
    { id: 15, operator: 'huangli', module: '字典管理', action: '编辑', detail: '更新字典项：岗位级别', ip: '10.80.90.100', time: '2024-12-02 09:15:33', duration: 75, status: 'Success' },
  ],
  get filtered() {
    let rows = this.allData.filter(r => {
      const matchKw = !this.keyword || r.operator.includes(this.keyword) || r.detail.includes(this.keyword)
      const matchModule = this.filterModule === 'All' || r.module === this.filterModule
      const matchAction = this.filterAction === 'All' || r.action === this.filterAction
      const matchStatus = this.filterStatus === 'All' || r.status === this.filterStatus
      return matchKw && matchModule && matchAction && matchStatus
    })
    const dir = this.sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[this.sortField], vb = b[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
    return rows
  },
  get paged() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filtered.slice(start, start + this.pageSize)
  },
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)) },
  get total() { return this.filtered.length },
  get modules() { return ['全部', ...new Set(this.allData.map(r => r.module))] },
  get actions() { return ['全部', ...new Set(this.allData.map(r => r.action))] },
  toggleSort(field) {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    else { this.sortField = field; this.sortDir = 'asc' }
  },
  get statusClass() {
    return (s) => s === 'Success' ? 'bg-green-100 text-green-700' : s === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  },
  formatDuration(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's'
    return ms + 'ms'
  },
  search() { this.currentPage = 1 },
  reset() { this.keyword = ''; this.filterModule = 'All'; this.filterAction = 'All'; this.filterStatus = 'All'; this.filterDateStart = ''; this.filterDateEnd = ''; this.currentPage = 1 },
  exportData() { Alpine.notify.success(Alpine.store('i18n').t('notify.exported') + ' ' + this.total + ' ' + Alpine.store('i18n').t('opLog.title')) }
}))

// ========== APPLY SAVED STATE ==========
if (Alpine.store('app').dark) {
  document.documentElement.classList.add('dark')
}
document.documentElement.style.setProperty('--primary', Alpine.store('app').themeColor)

// ========== COMMAND PALETTE ==========
Alpine.data('commandPalette', () => ({
  query: '', results: [],
  init() {
    try { this.getResults() } catch(e) {
      console.error('commandPalette init error:', e.message)
    }
  },
  getResults() {
    if (!this.query.trim()) {
      this.results = MENU_GROUPS.flatMap(g => g.items).slice(0, 6)
      return
    }
    const q = this.query.toLowerCase()
    this.results = MENU_GROUPS.flatMap(g => g.items).filter(i =>
      i.title.toLowerCase().includes(q) || i.name.includes(q)
    )
  },
  navigate(item) {
    Alpine.store('app').navigate(item)
    Alpine.store('app').commandPaletteOpen = false
  }
}))

// ========== FULLSCREEN TOGGLE ==========
window.toggleFullscreen = function() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else document.exitFullscreen()
}

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
    e.preventDefault()
    Alpine.store('app').openCommandPalette()
  }
  if (e.key === 'Escape') {
    Alpine.store('app').commandPaletteOpen = false
  }
})

window.Alpine = Alpine
// Defer Alpine.start() by one microtask so page module Alpine.data() runs first
setTimeout(() => Alpine.start(), 0)

Alpine.store('app').commandPaletteOpen = false
Alpine.store('app').settingOpen = false
Alpine.store('app').mobileMenuOpen = false

Alpine.data('tablePage', () => ({
  keyword: '',
  filterStatus: 'All',
  filterType: 'All',
  filterDate: '',
  selectedIds: new Set(),
  sortField: 'id',
  sortDir: 'asc',
  currentPage: 1,
  pageSize: 10,
  allData: [
    { id: 1, name: '商品数据A', type: 'A类', typeClass: 'bg-blue-100 text-blue-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-01-15', enabled: true },
    { id: 2, name: '商品数据B', type: 'B类', typeClass: 'bg-purple-100 text-purple-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-02-20', enabled: true },
    { id: 3, name: '商品数据C', type: 'C类', typeClass: 'bg-orange-100 text-orange-700', status: 'Disabled', statusClass: 'bg-red-100 text-red-700', date: '2024-03-10', enabled: false },
    { id: 4, name: '商品数据D', type: 'A类', typeClass: 'bg-blue-100 text-blue-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-04-05', enabled: true },
    { id: 5, name: '商品数据E', type: 'D类', typeClass: 'bg-pink-100 text-pink-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-05-12', enabled: true },
    { id: 6, name: '商品数据F', type: 'B类', typeClass: 'bg-purple-100 text-purple-700', status: 'Disabled', statusClass: 'bg-red-100 text-red-700', date: '2024-06-18', enabled: false },
    { id: 7, name: '商品数据G', type: 'C类', typeClass: 'bg-orange-100 text-orange-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-07-22', enabled: true },
    { id: 8, name: '商品数据H', type: 'A类', typeClass: 'bg-blue-100 text-blue-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-08-30', enabled: true },
    { id: 9, name: '商品数据I', type: 'D类', typeClass: 'bg-pink-100 text-pink-700', status: 'Disabled', statusClass: 'bg-red-100 text-red-700', date: '2024-09-05', enabled: false },
    { id: 10, name: '商品数据J', type: 'B类', typeClass: 'bg-purple-100 text-purple-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-10-11', enabled: true },
    { id: 11, name: '商品数据K', type: 'C类', typeClass: 'bg-orange-100 text-orange-700', status: 'Active', statusClass: 'bg-green-100 text-green-700', date: '2024-11-15', enabled: true },
    { id: 12, name: '商品数据L', type: 'A类', typeClass: 'bg-blue-100 text-blue-700', status: 'Disabled', statusClass: 'bg-red-100 text-red-700', date: '2024-12-20', enabled: false },
  ],
  get filtered() {
    let rows = this.allData.filter(row => {
      const matchKw = !this.keyword || row.name.includes(this.keyword)
      const matchStatus = this.filterStatus === 'All' || row.status === this.filterStatus
      const matchType = this.filterType === '全部' || row.type === this.filterType
      const matchDate = !this.filterDate || row.date.startsWith(this.filterDate)
      return matchKw && matchStatus && matchType && matchDate
    })
    const dir = this.sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[this.sortField], vb = b[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
    return rows
  },
  get paged() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filtered.slice(start, start + this.pageSize)
  },
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)) },
  get total() { return this.filtered.length },
  toggleAll(source) {
    if (source.target.checked) this.selectedIds = new Set(this.paged.map(r => r.id))
    else this.selectedIds.clear()
  },
  toggleRow(id) { if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id) },
  isSelected(id) { return this.selectedIds.has(id) },
  isAllSelected() { return this.paged.length > 0 && this.paged.every(r => this.selectedIds.has(r.id)) },
  toggleSort(field) {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    else { this.sortField = field; this.sortDir = 'asc' }
  },
  search() { this.currentPage = 1 },
  reset() { this.keyword = ''; this.filterStatus = 'All'; this.filterType = 'All'; this.filterDate = ''; this.currentPage = 1 },
  deleteRow(id) {
    this.allData = this.allData.filter(r => r.id !== id)
    Alpine.notify.success(Alpine.store('i18n').t('notify.deleted'))
  },
  exportData() { Alpine.notify.success(Alpine.store('i18n').t('notify.exported') + ' ' + (this.selectedIds.size || this.total) + ' rows') }
}))

// ========== DICT PAGE ==========
Alpine.data('dictPage', () => ({
  selectedType: null,
  types: [
    { id: 1, name: '用户状态', code: 'user_status', items: [
      { id: 1, label: '正常', value: 'active', sort: 1, status: 'Active' },
      { id: 2, label: 'Disabled', value: 'disabled', sort: 2, status: 'Active' },
      { id: 3, label: '冻结', value: 'frozen', sort: 3, status: 'Disabled' },
    ]},
    { id: 2, name: '性别', code: 'gender', items: [
      { id: 4, label: '男', value: 'male', sort: 1, status: 'Active' },
      { id: 5, label: '女', value: 'female', sort: 2, status: 'Active' },
      { id: 6, label: '未知', value: 'unknown', sort: 3, status: 'Active' },
    ]},
    { id: 3, name: '岗位级别', code: 'job_level', items: [
      { id: 7, label: '初级', value: 'junior', sort: 1, status: 'Active' },
      { id: 8, label: '中级', value: 'mid', sort: 2, status: 'Active' },
      { id: 9, label: '高级', value: 'senior', sort: 3, status: 'Active' },
      { id: 10, label: '专家', value: 'expert', sort: 4, status: 'Active' },
      { id: 11, label: '首席', value: 'principal', sort: 5, status: 'Active' },
    ]},
    { id: 4, name: '部门类型', code: 'dept_type', items: [
      { id: 12, label: '公司', value: 'company', sort: 1, status: 'Active' },
      { id: 13, label: '中心', value: 'center', sort: 2, status: 'Active' },
      { id: 14, label: '部门', value: 'dept', sort: 3, status: 'Active' },
      { id: 15, label: '小组', value: 'group', sort: 4, status: 'Disabled' },
    ]},
  ],
  selectType(type) { this.selectedType = type },
  toggleStatus(item) {
    item.status = item.status === 'Active' ? 'Disabled' : 'Active'
    Alpine.notify.success(`${item.label}: ${item.status}`)
  },
}))

// ========== MENU PAGE ==========
Alpine.data('menuPage', () => ({
  menus: [
    { id: 1, name: '首页', path: '/pages/admin/dashboard.html', icon: 'home', sort: 1, visible: true, component: 'layout', children: [] },
    { id: 2, name: '系统管理', path: '#', icon: 'cog', sort: 2, visible: true, component: 'layout', children: [
      { id: 3, name: '用户管理', path: '/pages/admin/user.html', icon: 'users', sort: 1, visible: true, component: 'view', children: [] },
      { id: 4, name: '角色权限', path: '/pages/admin/role.html', icon: 'shield', sort: 2, visible: true, component: 'view', children: [] },
      { id: 5, name: '菜单管理', path: '/pages/admin/menu.html', icon: 'menu', sort: 3, visible: true, component: 'view', children: [] },
      { id: 6, name: '部门管理', path: '/pages/admin/dept.html', icon: 'computer', sort: 4, visible: true, component: 'view', children: [] },
      { id: 7, name: '字典管理', path: '/pages/admin/dict.html', icon: 'book', sort: 5, visible: true, component: 'view', children: [] },
      { id: 8, name: '登录日志', path: '/pages/admin/login-log.html', icon: 'document', sort: 6, visible: true, component: 'view', children: [] },
      { id: 9, name: '操作日志', path: '/pages/admin/op-log.html', icon: 'document', sort: 7, visible: true, component: 'view', children: [] },
    ]},
    { id: 10, name: '表单页', path: '#', icon: 'form', sort: 3, visible: true, component: 'layout', children: [
      { id: 11, name: '基础表单', path: '/pages/admin/form-basic.html', icon: 'form', sort: 1, visible: true, component: 'view', children: [] },
      { id: 12, name: '高级表单', path: '/pages/admin/form-advanced.html', icon: 'form', sort: 2, visible: true, component: 'view', children: [] },
    ]},
    { id: 13, name: '列表页', path: '#', icon: 'table', sort: 4, visible: true, component: 'layout', children: [
      { id: 14, name: '表格列表', path: '/pages/admin/table.html', icon: 'table', sort: 1, visible: true, component: 'view', children: [] },
    ]},
    { id: 15, name: 'AI 助手', path: '/pages/admin/ai-chat.html', icon: 'lightning', sort: 5, visible: true, component: 'view', children: [] },
    { id: 16, name: '关于', path: '/pages/admin/about.html', icon: 'info', sort: 6, visible: true, component: 'view', children: [] },
  ],
  expandedRows: new Set([2, 3]),
  toggleExpand(id) { if (this.expandedRows.has(id)) this.expandedRows.delete(id); else this.expandedRows.add(id) },
  isExpanded(id) { return this.expandedRows.has(id) },
  toggleVisible(item) { item.visible = !item.visible; Alpine.notify.success(item.visible ? 'Shown' : 'Hidden') },
  getComponentBadge(type) { return type === 'layout' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600' },
}))
