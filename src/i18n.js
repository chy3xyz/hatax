const I18N_MESSAGES = {
  zh: {
    app: { title: 'HatTax 管理后台', search: '搜索菜单...', dark: '暗黑模式', light: '浅色模式' },
    menu: {
      main: '主菜单', system: '系统管理', content: '内容管理', audit: '日志审计', form: '表单页', list: '列表页', personal: '个人页', other: '其他',
      dashboard: '首页', user: '用户管理', role: '角色权限', menu: '菜单管理', dept: '部门管理', dict: '字典管理',
      blog: '博客管理', forum: '论坛管理', 'forum-categories': '分区管理', tags: '标签管理',
      members: '社区会员', tasks: '任务管理', courses: '课程管理', events: '活动管理',
      loginLog: '登录日志', 'login-log': '登录日志', opLog: '操作日志', 'op-log': '操作日志',
      formBasic: '基础表单', 'form-basic': '基础表单', formAdvanced: '高级表单', 'form-advanced': '高级表单',
      tableList: '表格列表', table: '表格列表', profile: '个人中心', aiChat: 'AI 助手', 'ai-chat': 'AI 助手', about: '关于',
      'user-form': '新增用户',
    },
    header: { themeColor: '主题颜色', themeColors: '切换主题色', fullscreen: '全屏', notifications: '通知中心', markAllRead: '全部已读', viewAll: '查看全部通知', settings: '界面设置', account: '账号设置', logout: '退出登录', admin: '管理员' },
    tab: { closeCurrent: '关闭当前', closeLeft: '关闭左侧', closeRight: '关闭右侧', closeAll: '关闭全部' },
    footer: { copyright: 'HatTax Admin © 2026', style: 'Vue Vben Admin 风格', powered: 'Powered by Vite + Alpine' },
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
      main: 'Main', system: 'System', content: 'Content', audit: 'Audit', form: 'Forms', list: 'Tables', personal: 'Personal', other: 'Other',
      dashboard: 'Dashboard', user: 'Users', role: 'Roles', menu: 'Menus', dept: 'Departments', dict: 'Dictionary',
      blog: 'Blog', forum: 'Forum', 'forum-categories': 'Categories', tags: 'Tags',
      members: 'Members', tasks: 'Tasks', courses: 'Courses', events: 'Events',
      loginLog: 'Login Logs', 'login-log': 'Login Logs', opLog: 'Op Logs', 'op-log': 'Op Logs',
      formBasic: 'Basic Form', 'form-basic': 'Basic Form', formAdvanced: 'Advanced Form', 'form-advanced': 'Advanced Form',
      tableList: 'Table List', table: 'Table List', profile: 'Profile', aiChat: 'AI Chat', 'ai-chat': 'AI Chat', about: 'About',
      'user-form': 'New User',
    },
    header: { themeColor: 'Theme Colors', themeColors: 'Switch Theme', fullscreen: 'Fullscreen', notifications: 'Notifications', markAllRead: 'Mark All Read', viewAll: 'View All', settings: 'Settings', account: 'Account', logout: 'Logout', admin: 'Admin' },
    tab: { closeCurrent: 'Close', closeLeft: 'Close Left', closeRight: 'Close Right', closeAll: 'Close All' },
    footer: { copyright: 'HatTax Admin © 2026', style: 'Vben Admin Style', powered: 'Powered by Vite + Alpine' },
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

function lookupMessage(locale, key) {
  const keys = key.split('.')
  let msg = I18N_MESSAGES[locale] || I18N_MESSAGES.zh
  for (const k of keys) {
    if (msg == null || typeof msg !== 'object') return undefined
    msg = msg[k]
  }
  return typeof msg === 'string' ? msg : undefined
}

export function registerI18n(Alpine) {
  Alpine.store('i18n', {
    locale: Alpine.storage ? Alpine.storage.get('locale', 'zh') : 'zh',
    init() { document.documentElement.lang = this.locale },
    t(key, fallback) {
      const hit = lookupMessage(this.locale, key) ?? lookupMessage('zh', key)
      if (hit != null) return hit
      return fallback != null ? fallback : key
    },
    /** 侧栏/标签/面包屑菜单标题：优先当前语言，再回退中文与传入 fallback */
    menuTitle(name, fallback = '') {
      if (!name) return fallback || ''
      return (
        lookupMessage(this.locale, 'menu.' + name) ||
        lookupMessage('zh', 'menu.' + name) ||
        fallback ||
        name
      )
    },
    setLocale(locale) {
      this.locale = locale
      document.documentElement.lang = locale
      if (Alpine.storage) Alpine.storage.set('locale', locale)
      const app = Alpine.store('app')
      if (app?.relocalizeMenus) app.relocalizeMenus()
    },
    toggleLocale() {
      this.setLocale(this.locale === 'zh' ? 'en' : 'zh')
    },
  })
}

export { I18N_MESSAGES }
