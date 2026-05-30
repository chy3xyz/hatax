import './style.css'
import Alpine from 'alpinejs'
import htmx from 'htmx.org'
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
const I18N_MESSAGES = {
  zh: {
    app: { title: 'HatTax 管理后台', search: '搜索菜单...', dark: '暗黑模式', light: '浅色模式' },
    menu: {
      main: '主菜单', system: '系统管理', audit: '日志审计', form: '表单页', list: '列表页', personal: '个人页', other: '其他',
      dashboard: '首页', user: '用户管理', role: '角色权限', menu: '菜单管理', dept: '部门管理', dict: '字典管理',
      loginLog: '登录日志', opLog: '操作日志', formBasic: '基础表单', formAdvanced: '高级表单',
      tableList: '表格列表', profile: '个人中心', aiChat: 'AI 助手', about: '关于',
    },
    header: { themeColor: '主题颜色', themeColors: '切换主题色', fullscreen: '全屏', notifications: '通知中心', markAllRead: '全部已读', viewAll: '查看全部通知', settings: '界面设置', account: '账号设置', logout: '退出登录', admin: '管理员' },
    tab: { closeCurrent: '关闭当前', closeLeft: '关闭左侧', closeRight: '关闭右侧', closeAll: '关闭全部' },
    footer: { copyright: 'HatTax Admin © 2024', style: 'Vue Vben Admin 风格', powered: 'Powered by Vite + Alpine' },
    settings: {
      title: '界面设置', themeColor: '主题颜色', customColor: '自定义颜色', apply: '应用',
      displayMode: '显示模式', lightMode: '浅色模式', darkMode: '深色模式',
      sidebar: '侧边栏', fixedSidebar: '固定侧边栏', showToggle: '侧边栏折叠按钮',
      tabs: '标签页', showTabs: '显示标签栏',
      transition: '过渡动画', off: '关闭', fast: '快速', normal: '正常', slow: '缓慢',
      reset: '重置所有设置', saved: '设置已保存', resetDone: '已恢复默认设置', followSystem: '已跟随系统主题',
    },
    common: { save: '保存', cancel: '取消', confirm: '确认', search: '搜索', reset: '重置', edit: '编辑', delete: '删除', add: '新增', refresh: '刷新', export: '导出', loading: '加载中...', noData: '暂无数据', back: '返回', submit: '提交', submitting: '提交中...', success: '操作成功' },
    notify: { success: 'Success', error: 'Error', warning: 'Warning', info: '提示', requestFailed: '请求失败', pageLoadFailed: '页面加载失败', refreshed: '已刷新', dataRefreshed: '数据已刷新', deleteConfirm: '确定要删除吗？', deleted: '删除成功', exported: '已导出' },
    login: { title: '登录 - HatTax 管理后台', subtitle: '请登录以继续', username: '用户名', password: '密码', remember: '记住我', forgotPwd: '忘记密码？', loginBtn: '登录', loggingIn: '登录中...', testAccount: '测试账号', error: '用户名或密码错误', enterUsername: '请输入用户名', enterPassword: '请输入密码' },
    dashboard: { title: '仪表盘', welcome: '欢迎回来，管理员！以下是系统概览。', totalUsers: '总用户', activeUsers: '活跃用户', totalOrders: '订单总数', totalSales: '总销售额', vsLastMonth: '较上月', dataAnalysis: '数据分析', workspace: '工作台', sales: '销售额', orders: '订单量', userDist: '用户分布' },
    user: { title: '用户管理', addUser: '新增用户', searchUser: '搜索用户名/手机号', allRoles: '全部角色', allStatus: '全部状态', superAdmin: '超级管理员', normalUser: '普通用户', normal: '正常', disabled: 'Disabled', phone: '手机号', role: '角色', status: '状态', createdAt: '创建时间', actions: '操作', editUser: '编辑用户', deleteWarning: '删除需二次确认', totalRecords: '共 N 条记录', prevPage: '上一页', nextPage: '下一页' },
    role: { title: '角色权限' },
    dept: { title: '部门管理', addDept: '新增部门', expandAll: '展开全部', collapseAll: '折叠全部' },
    dict: { title: '字典管理', selectType: '请从左侧选择字典类型', addItem: '新增条目' },
    loginLog: { title: '登录日志' },
    opLog: { title: '操作日志' },
    aiChat: { title: 'AI 助手', online: '在线', placeholder: '输入消息，Enter 发送，Shift+Enter 换行...', clearChat: '清空对话', welcomeMsg: '你好！我是 HatTax AI 助手。我可以帮你分析数据、解答技术问题、生成报告。有什么可以帮到你的？', clearedMsg: '对话已清空。有什么新的问题吗？' },
    portal: { title: 'HatTax — 新一代企业管理平台', nav: { features: '功能', pricing: '定价', docs: '文档', about: '关于' }, hero: { badge: 'v1.0 正式发布', title1: '用', title2: '轻量架构', title3: '构建企业级管理后台', desc: 'Vite + Alpine.js + HTMX + Tailwind CSS。无 React、无 Vue、无复杂构建。15KB 运行时 + 10KB 网络层 = 极速管理后台。', cta: '立即体验 →', github: 'GitHub' } },
  },
  en: {
    app: { title: 'HatTax Admin', search: 'Search menus...', dark: 'Dark Mode', light: 'Light Mode' },
    menu: {
      main: 'Main', system: 'System', audit: 'Audit', form: 'Forms', list: 'Tables', personal: 'Personal', other: 'Other',
      dashboard: 'Dashboard', user: 'Users', role: 'Roles', menu: 'Menus', dept: 'Departments', dict: 'Dictionary',
      loginLog: 'Login Logs', opLog: 'Op Logs', formBasic: 'Basic Form', formAdvanced: 'Advanced Form',
      tableList: 'Table List', profile: 'Profile', aiChat: 'AI Chat', about: 'About',
    },
    header: { themeColor: 'Theme Colors', themeColors: 'Switch Theme', fullscreen: 'Fullscreen', notifications: 'Notifications', markAllRead: 'Mark All Read', viewAll: 'View All', settings: 'Settings', account: 'Account', logout: 'Logout', admin: 'Admin' },
    tab: { closeCurrent: 'Close', closeLeft: 'Close Left', closeRight: 'Close Right', closeAll: 'Close All' },
    footer: { copyright: 'HatTax Admin © 2024', style: 'Vben Admin Style', powered: 'Powered by Vite + Alpine' },
    settings: {
      title: 'Settings', themeColor: 'Theme Color', customColor: 'Custom Color', apply: 'Apply',
      displayMode: 'Display Mode', lightMode: 'Light', darkMode: 'Dark',
      sidebar: 'Sidebar', fixedSidebar: 'Fixed Sidebar', showToggle: 'Show Toggle Button',
      tabs: 'Tabs', showTabs: 'Show Tab Bar',
      transition: 'Transition', off: 'Off', fast: 'Fast', normal: 'Normal', slow: 'Slow',
      reset: 'Reset All Settings', saved: 'Settings saved', resetDone: 'Settings reset to default', followSystem: 'Following system theme',
    },
    common: { save: 'Save', cancel: 'Cancel', confirm: 'OK', search: 'Search', reset: 'Reset', edit: 'Edit', delete: 'Delete', add: 'Add', refresh: 'Refresh', export: 'Export', loading: 'Loading...', noData: 'No Data', back: 'Back', submit: 'Submit', submitting: 'Submitting...', success: 'Success' },
    notify: { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info', requestFailed: 'Request failed', pageLoadFailed: 'Page load failed', refreshed: 'Refreshed', dataRefreshed: 'Data refreshed', deleteConfirm: 'Are you sure?', deleted: 'Deleted', exported: 'Exported' },
    login: { title: 'Login - HatTax Admin', subtitle: 'Please sign in to continue', username: 'Username', password: 'Password', remember: 'Remember me', forgotPwd: 'Forgot password?', loginBtn: 'Sign In', loggingIn: 'Signing in...', testAccount: 'Test Account', error: 'Invalid username or password', enterUsername: 'Please enter username', enterPassword: 'Please enter password' },
    dashboard: { title: 'Dashboard', welcome: 'Welcome back, Admin! Here is your overview.', totalUsers: 'Total Users', activeUsers: 'Active Users', totalOrders: 'Total Orders', totalSales: 'Total Sales', vsLastMonth: 'vs last month', dataAnalysis: 'Analytics', workspace: 'Workspace', sales: 'Sales', orders: 'Orders', userDist: 'User Distribution' },
    user: { title: 'Users', addUser: 'Add User', searchUser: 'Search username/phone', allRoles: 'All Roles', allStatus: 'All Status', superAdmin: 'Super Admin', normalUser: 'User', normal: 'Active', disabled: 'Disabled', phone: 'Phone', role: 'Role', status: 'Status', createdAt: 'Created', actions: 'Actions', editUser: 'Edit', deleteWarning: 'Delete?', totalRecords: 'Total N records', prevPage: 'Prev', nextPage: 'Next' },
    role: { title: 'Roles & Permissions' },
    dept: { title: 'Departments', addDept: 'Add Dept', expandAll: 'Expand All', collapseAll: 'Collapse All' },
    dict: { title: 'Dictionary', selectType: 'Select a dictionary type from the left', addItem: 'Add Item' },
    loginLog: { title: 'Login Logs' },
    opLog: { title: 'Operation Logs' },
    aiChat: { title: 'AI Assistant', online: 'Online', placeholder: 'Type a message, Enter to send, Shift+Enter for new line...', clearChat: 'Clear Chat', welcomeMsg: 'Hello! I\'m HatTax AI Assistant. I can help you analyze data, answer technical questions, and generate reports. How can I help?', clearedMsg: 'Chat cleared. Any other questions?' },
    portal: { title: 'HatTax — Next-Gen Business Platform', nav: { features: 'Features', pricing: 'Pricing', docs: 'Docs', about: 'About' }, hero: { badge: 'v1.0 Released', title1: 'Build Enterprise', title2: 'Admin Dashboards', title3: 'with Lightweight Stack', desc: 'Vite + Alpine.js + HTMX + Tailwind CSS. No React, no Vue, no complex build. 15KB runtime + 10KB network layer = blazing fast admin.', cta: 'Get Started →', github: 'GitHub' } },
  },
}

Alpine.store('i18n', {
  locale: Alpine.storage ? Alpine.storage.get('locale', 'en') : 'en',
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
    this.setLocale(this.locale === 'zh' ? 'en' : 'zh')
  },
})

// ========== MENU MAP & GROUPS ==========
export const MENU_MAP = {
  'dashboard': { group: '主菜单', title: '首页', path: '/pages/dashboard.html', breadcrumbs: [{ title: '首页', path: '/pages/dashboard.html' }] },
  'user': { group: '系统管理', title: '用户管理', path: '/pages/user.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '用户管理', path: '/pages/user.html' }] },
  'role': { group: '系统管理', title: '角色权限', path: '/pages/role.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '角色权限', path: '/pages/role.html' }] },
  'menu': { group: '系统管理', title: '菜单管理', path: '/pages/menu.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '菜单管理', path: '/pages/menu.html' }] },
  'dept': { group: '系统管理', title: '部门管理', path: '/pages/dept.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '部门管理', path: '/pages/dept.html' }] },
  'dict': { group: '系统管理', title: '字典管理', path: '/pages/dict.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '字典管理', path: '/pages/dict.html' }] },
  'login-log': { group: '系统管理', title: '登录日志', path: '/pages/login-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '登录日志', path: '/pages/login-log.html' }] },
  'op-log': { group: '系统管理', title: '操作日志', path: '/pages/op-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '操作日志', path: '/pages/op-log.html' }] },
  'form-basic': { group: '表单页', title: '基础表单', path: '/pages/form-basic.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '基础表单', path: '/pages/form-basic.html' }] },
  'form-advanced': { group: '表单页', title: '高级表单', path: '/pages/form-advanced.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '高级表单', path: '/pages/form-advanced.html' }] },
  'table': { group: '列表页', title: '表格列表', path: '/pages/table.html', breadcrumbs: [{ title: '列表页', path: '#' }, { title: '表格列表', path: '/pages/table.html' }] },
  'profile': { group: '个人页', title: '个人中心', path: '/pages/profile.html', breadcrumbs: [{ title: '个人中心', path: '/pages/profile.html' }] },
  'about': { group: '其他', title: '关于', path: '/pages/about.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: '关于', path: '/pages/about.html' }] },
  'ai-chat': { group: '其他', title: 'AI 助手', path: '/pages/ai-chat.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: 'AI 助手', path: '/pages/ai-chat.html' }] },
}

export const MENU_GROUPS = [
  {
    title: '主菜单', items: [
      { name: 'dashboard', title: '首页', path: '/pages/dashboard.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
    ]
  },
  {
    title: '系统管理', items: [
      { name: 'user', title: '用户管理', path: '/pages/user.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H9v-1a3 3 0 016 0v1zm0 0h6v-1a9 9 0 00-18 0v1h6"></path></svg>' },
      { name: 'role', title: '角色权限', path: '/pages/role.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>' },
      { name: 'menu', title: '菜单管理', path: '/pages/menu.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>' },
      { name: 'dept', title: '部门管理', path: '/pages/dept.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>' },
      { name: 'dict', title: '字典管理', path: '/pages/dict.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
    ]
  },
  {
    title: '日志审计', items: [
      { name: 'login-log', title: '登录日志', path: '/pages/login-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' },
      { name: 'op-log', title: '操作日志', path: '/pages/op-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
    ]
  },
  {
    title: '表单页', items: [
      { name: 'form-basic', title: '基础表单', path: '/pages/form-basic.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
      { name: 'form-advanced', title: '高级表单', path: '/pages/form-advanced.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
    ]
  },
  {
    title: '列表页', items: [
      { name: 'table', title: '表格列表', path: '/pages/table.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' },
    ]
  },
  {
    title: '个人页', items: [
      { name: 'profile', title: '个人中心', path: '/pages/profile.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' },
    ]
  },
  {
    title: '其他', items: [
      { name: 'ai-chat', title: 'AI 助手', path: '/pages/ai-chat.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' },
      { name: 'about', title: '关于', path: '/pages/about.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
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
  breadcrumbs: [{ title: '首页', path: '/pages/dashboard.html' }],
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
      const url = `/pages/${this.tabs[0].name}.html`
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
      const url = `/pages/${this.tabs[0].name}.html`
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
      const url = `/pages/${this.tabs[this.tabs.length - 1].name}.html`
      this._navigateTo(url, this.tabs[this.tabs.length - 1].title)
    }
    this._persist()
  },

  closeAllTabs() {
    this.tabs = [{ title: '首页', name: 'dashboard', active: true }]
    this.activeMenu = 'dashboard'
    this._navigateTo('/pages/dashboard.html', '首页')
    this._persist()
  },

  navigate(item) {
    const meta = MENU_MAP[item.name] || {}
    this.addTab(item.name, item.title)
    this.breadcrumbs = meta.breadcrumbs || [{ title: item.title, path: item.path }]
    this._navigateTo(item.path, item.title)
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
    this.container.className = 'fixed top-4 right-4 z-[99999] space-y-2 w-80'
    document.body.appendChild(this.container)
  },
  create(type, content, opts = {}) {
    if (!this.container) this.init()
    const { duration = 3500, title = '' } = opts
    const cfg = {
      success:    { bg: 'bg-emerald-500', icon: 'M5 13l4 4L19 7', title: 'Success' },
      error:      { bg: 'bg-red-500',    icon: 'M6 18L18 6M6 6l12 12',   title: 'Error' },
      warning:    { bg: 'bg-amber-500',  icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', title: 'Warning' },
      info:       { bg: 'bg-blue-500',   icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '提示' },
    }
    const c = cfg[type] || cfg.info
    const el = document.createElement('div')
    el.className = `notify-item ${c.bg} text-white rounded-lg shadow-2xl overflow-hidden transform translate-x-full transition-transform duration-300`
    el.innerHTML = `
      <div class="flex items-start gap-3 p-4">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${c.icon}"></path></svg>
        <div class="flex-1 min-w-0">
          ${title ? `<div class="font-semibold text-sm mb-0.5">${title}</div>` : ''}
          <div class="text-sm opacity-90">${content}</div>
        </div>
        <button class="opacity-60 hover:opacity-100 flex-shrink-0" @click="this.closest('.notify-item').remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="h-1 bg-white/20">
        <div class="h-full bg-white/40 progress-bar" style="animation: notify-progress ${duration}ms linear forwards"></div>
      </div>`
    this.container.appendChild(el)
    requestAnimationFrame(() => { el.classList.remove('translate-x-full') })
    const timer = setTimeout(() => this.remove(el), duration)
    el._timer = timer
  },
  remove(el) {
    if (!el || !el.parentNode) return
    clearTimeout(el._timer)
    el.classList.add('translate-x-full')
    setTimeout(() => el.remove(), 300)
  },
  success(content, opts) { this.create('success', content, opts) },
  error(content, opts) { this.create('error', content, opts) },
  warning(content, opts) { this.create('warning', content, opts) },
  info(content, opts) { this.create('info', content, opts) },
}

// ========== ALPINE MESSAGE (alias) ==========
Alpine.message = Alpine.notify

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
Alpine.start()

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
    { id: 1, name: '首页', path: '/pages/dashboard.html', icon: 'home', sort: 1, visible: true, component: 'layout', children: [] },
    { id: 2, name: '系统管理', path: '#', icon: 'cog', sort: 2, visible: true, component: 'layout', children: [
      { id: 3, name: '用户管理', path: '/pages/user.html', icon: 'users', sort: 1, visible: true, component: 'view', children: [] },
      { id: 4, name: '角色权限', path: '/pages/role.html', icon: 'shield', sort: 2, visible: true, component: 'view', children: [] },
      { id: 5, name: '菜单管理', path: '/pages/menu.html', icon: 'menu', sort: 3, visible: true, component: 'view', children: [] },
      { id: 6, name: '部门管理', path: '/pages/dept.html', icon: 'computer', sort: 4, visible: true, component: 'view', children: [] },
      { id: 7, name: '字典管理', path: '/pages/dict.html', icon: 'book', sort: 5, visible: true, component: 'view', children: [] },
      { id: 8, name: '登录日志', path: '/pages/login-log.html', icon: 'document', sort: 6, visible: true, component: 'view', children: [] },
      { id: 9, name: '操作日志', path: '/pages/op-log.html', icon: 'document', sort: 7, visible: true, component: 'view', children: [] },
    ]},
    { id: 10, name: '表单页', path: '#', icon: 'form', sort: 3, visible: true, component: 'layout', children: [
      { id: 11, name: '基础表单', path: '/pages/form-basic.html', icon: 'form', sort: 1, visible: true, component: 'view', children: [] },
      { id: 12, name: '高级表单', path: '/pages/form-advanced.html', icon: 'form', sort: 2, visible: true, component: 'view', children: [] },
    ]},
    { id: 13, name: '列表页', path: '#', icon: 'table', sort: 4, visible: true, component: 'layout', children: [
      { id: 14, name: '表格列表', path: '/pages/table.html', icon: 'table', sort: 1, visible: true, component: 'view', children: [] },
    ]},
    { id: 15, name: 'AI 助手', path: '/pages/ai-chat.html', icon: 'lightning', sort: 5, visible: true, component: 'view', children: [] },
    { id: 16, name: '关于', path: '/pages/about.html', icon: 'info', sort: 6, visible: true, component: 'view', children: [] },
  ],
  expandedRows: new Set([2, 3]),
  toggleExpand(id) { if (this.expandedRows.has(id)) this.expandedRows.delete(id); else this.expandedRows.add(id) },
  isExpanded(id) { return this.expandedRows.has(id) },
  toggleVisible(item) { item.visible = !item.visible; Alpine.notify.success(item.visible ? 'Shown' : 'Hidden') },
  getComponentBadge(type) { return type === 'layout' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600' },
}))
