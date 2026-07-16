export const MENU_MAP = {
  'dashboard': { group: '主菜单', title: '首页', path: '/admin/dashboard.html', breadcrumbs: [{ title: '首页', path: '/admin/dashboard.html' }] },
  'user-form': { group: '系统管理', title: '新增用户', path: '/admin/user-form.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '用户管理', path: '/admin/user.html' }, { title: '新增用户', path: '/admin/user-form.html' }] },
  'user': { group: '系统管理', title: '用户管理', path: '/admin/user.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '用户管理', path: '/admin/user.html' }] },
  'role': { group: '系统管理', title: '角色权限', path: '/admin/role.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '角色权限', path: '/admin/role.html' }] },
  'menu': { group: '系统管理', title: '菜单管理', path: '/admin/menu.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '菜单管理', path: '/admin/menu.html' }] },
  'dept': { group: '系统管理', title: '部门管理', path: '/admin/dept.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '部门管理', path: '/admin/dept.html' }] },
  'dict': { group: '系统管理', title: '字典管理', path: '/admin/dict.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '字典管理', path: '/admin/dict.html' }] },
  'login-log': { group: '系统管理', title: '登录日志', path: '/admin/login-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '登录日志', path: '/admin/login-log.html' }] },
  'op-log': { group: '系统管理', title: '操作日志', path: '/admin/op-log.html', breadcrumbs: [{ title: '系统管理', path: '#' }, { title: '操作日志', path: '/admin/op-log.html' }] },
  'form-basic': { group: '表单页', title: '基础表单', path: '/admin/form-basic.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '基础表单', path: '/admin/form-basic.html' }] },
  'form-advanced': { group: '表单页', title: '高级表单', path: '/admin/form-advanced.html', breadcrumbs: [{ title: '表单页', path: '#' }, { title: '高级表单', path: '/admin/form-advanced.html' }] },
  'table': { group: '列表页', title: '表格列表', path: '/admin/table.html', breadcrumbs: [{ title: '列表页', path: '#' }, { title: '表格列表', path: '/admin/table.html' }] },
  'profile': { group: '个人页', title: '个人中心', path: '/admin/profile.html', breadcrumbs: [{ title: '个人中心', path: '/admin/profile.html' }] },
  'about': { group: '其他', title: '关于', path: '/admin/about.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: '关于', path: '/admin/about.html' }] },
  'ai-chat': { group: '其他', title: 'AI 助手', path: '/admin/ai-chat.html', breadcrumbs: [{ title: '其他', path: '#' }, { title: 'AI 助手', path: '/admin/ai-chat.html' }] },
  'blog': { group: '内容管理', title: '博客管理', path: '/admin/blog.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '博客管理', path: '/admin/blog.html' }] },
  'forum': { group: '内容管理', title: '论坛管理', path: '/admin/forum.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '论坛管理', path: '/admin/forum.html' }] },
  'forum-categories': { group: '内容管理', title: '分区管理', path: '/admin/forum-categories.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '分区管理', path: '/admin/forum-categories.html' }] },
  'tags': { group: '内容管理', title: '标签管理', path: '/admin/tags.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '标签管理', path: '/admin/tags.html' }] },
  'members': { group: '内容管理', title: '社区会员', path: '/admin/members.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '社区会员', path: '/admin/members.html' }] },
  'tasks': { group: '内容管理', title: '任务管理', path: '/admin/tasks.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '任务管理', path: '/admin/tasks.html' }] },
  'courses': { group: '内容管理', title: '课程管理', path: '/admin/courses.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '课程管理', path: '/admin/courses.html' }] },
  'events': { group: '内容管理', title: '活动管理', path: '/admin/events.html', breadcrumbs: [{ title: '内容管理', path: '#' }, { title: '活动管理', path: '/admin/events.html' }] },
}

export const MENU_GROUPS = [
  { name: 'main',
    title: '主菜单', items: [
      { name: 'dashboard', title: '首页', path: '/admin/dashboard.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
    ]
  },
  { name: 'system',
    title: '系统管理', items: [
      { name: 'user', title: '用户管理', path: '/admin/user.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H9v-1a3 3 0 016 0v1zm0 0h6v-1a9 9 0 00-18 0v1h6"></path></svg>' },
      { name: 'role', title: '角色权限', path: '/admin/role.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>' },
      { name: 'menu', title: '菜单管理', path: '/admin/menu.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>' },
      { name: 'dept', title: '部门管理', path: '/admin/dept.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>' },
      { name: 'dict', title: '字典管理', path: '/admin/dict.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
    ]
  },
  { name: 'content',
    title: '内容管理', items: [
      { name: 'blog', title: '博客管理', path: '/admin/blog.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>' },
      { name: 'forum', title: '论坛管理', path: '/admin/forum.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>' },
      { name: 'forum-categories', title: '分区管理', path: '/admin/forum-categories.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h7"></path></svg>' },
      { name: 'tags', title: '标签管理', path: '/admin/tags.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>' },
      { name: 'members', title: '社区会员', path: '/admin/members.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' },
      { name: 'tasks', title: '任务管理', path: '/admin/tasks.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>' },
      { name: 'courses', title: '课程管理', path: '/admin/courses.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
      { name: 'events', title: '活动管理', path: '/admin/events.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' },
    ]
  },
  { name: 'audit',
    title: '日志审计', items: [
      { name: 'login-log', title: '登录日志', path: '/admin/login-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' },
      { name: 'op-log', title: '操作日志', path: '/admin/op-log.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
    ]
  },
  { name: 'form',
    title: '表单页', items: [
      { name: 'form-basic', title: '基础表单', path: '/admin/form-basic.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
      { name: 'form-advanced', title: '高级表单', path: '/admin/form-advanced.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
    ]
  },
  { name: 'list',
    title: '列表页', items: [
      { name: 'table', title: '表格列表', path: '/admin/table.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' },
    ]
  },
  { name: 'personal',
    title: '个人页', items: [
      { name: 'profile', title: '个人中心', path: '/admin/profile.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' },
    ]
  },
  { name: 'other',
    title: '其他', items: [
      { name: 'ai-chat', title: 'AI 助手', path: '/admin/ai-chat.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' },
      { name: 'about', title: '关于', path: '/admin/about.html', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
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
