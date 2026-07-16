import { getToken } from '../auth.js'
import { getCsrfToken } from '../htmx-setup.js'
import { apiUrl } from '../api-base.js'

function authHeaders(json = false) {
  const h = { Authorization: `Bearer ${getToken() || ''}` }
  if (json) h['Content-Type'] = 'application/json'
  const csrf = getCsrfToken()
  if (csrf) h['X-CSRF-Token'] = csrf
  return h
}

const PERM_GROUPS = [
  {
    key: 'system',
    label: '系统管理',
    items: [
      { key: 'system:user', label: '用户管理' },
      { key: 'system:role', label: '角色权限' },
      { key: 'system:menu', label: '菜单配置' },
      { key: 'system:dept', label: '部门管理' },
    ],
  },
  {
    key: 'biz',
    label: '业务管理',
    items: [
      { key: 'biz:dashboard', label: '仪表盘' },
      { key: 'biz:form', label: '基础表单' },
      { key: 'biz:table', label: '表格列表' },
      { key: 'biz:blog', label: '博客管理' },
      { key: 'biz:forum', label: '论坛管理' },
      { key: 'biz:members', label: '社区会员' },
      { key: 'biz:tags', label: '标签管理' },
      { key: 'biz:tasks', label: '任务管理' },
      { key: 'biz:courses', label: '课程管理' },
      { key: 'biz:events', label: '活动管理' },
    ],
  },
  {
    key: 'data',
    label: '数据管理',
    items: [
      { key: 'data:export', label: '数据导出' },
      { key: 'data:backup', label: '数据备份' },
      { key: 'data:oplog', label: '操作日志' },
    ],
  },
]

export function registerApiPages(Alpine) {
  Alpine.data('rolePage', () => ({
    roles: [],
    selected: null,
    saving: false,
    permGroups: PERM_GROUPS,

    async init() {
      await this.load()
    },

    async load() {
      try {
        const res = await fetch(apiUrl('/api/roles'), {
          headers: authHeaders(),
          credentials: 'include',
        })
        const json = await res.json()
        this.roles = json.data || []
        if (this.roles.length && !this.selected) {
          this.selectRole(this.roles[0])
        } else if (this.selected) {
          const fresh = this.roles.find((r) => r.id === this.selected.id)
          if (fresh) this.selectRole(fresh)
        }
      } catch {
        Alpine.notify?.error('加载角色失败')
      }
    },

    selectRole(role) {
      this.selected = {
        ...role,
        permissions: [...(role.permissions || [])],
      }
    },

    togglePerm(key, on) {
      if (!this.selected) return
      const set = new Set(this.selected.permissions)
      if (on) set.add(key)
      else set.delete(key)
      this.selected.permissions = [...set]
    },

    toggleGroup(group, on) {
      for (const item of group.items) this.togglePerm(item.key, on)
    },

    async save() {
      if (!this.selected) return
      this.saving = true
      try {
        const res = await fetch(apiUrl(`/api/roles/${this.selected.id}`), {
          method: 'PUT',
          credentials: 'include',
          headers: authHeaders(true),
          body: JSON.stringify({
            name: this.selected.name,
            description: this.selected.description,
            permissions: this.selected.permissions,
          }),
        })
        const json = await res.json()
        if (json.code !== 0) {
          Alpine.notify.error(json.msg || '保存失败')
        } else {
          Alpine.notify.success('权限更新成功')
          await this.load()
        }
      } catch {
        Alpine.notify.error('网络错误')
      } finally {
        this.saving = false
      }
    },

    async addRole() {
      const code = prompt('角色编码（英文，如 editor）')
      if (!code?.trim()) return
      const name = prompt('角色名称')
      if (!name?.trim()) return
      try {
        const res = await fetch(apiUrl('/api/roles'), {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(true),
          body: JSON.stringify({ code: code.trim(), name: name.trim(), permissions: [] }),
        })
        const json = await res.json()
        if (json.code !== 0) Alpine.notify.error(json.msg || '创建失败')
        else {
          Alpine.notify.success('已创建')
          await this.load()
          if (json.data) this.selectRole(json.data)
        }
      } catch {
        Alpine.notify.error('网络错误')
      }
    },
  }))

  Alpine.data('loginLogPage', () => ({
    keyword: '',
    filterStatus: '',
    filterDateStart: '',
    filterDateEnd: '',
    currentPage: 1,
    pageSize: 10,
    sortField: 'time',
    sortDir: 'desc',
    rows: [],
    total: 0,
    loading: false,

    get totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    get paged() {
      return this.rows
    },

    init() {
      this.fetch()
    },

    async fetch() {
      this.loading = true
      try {
        const q = new URLSearchParams({
          keyword: this.keyword,
          status: this.filterStatus,
          dateStart: this.filterDateStart,
          dateEnd: this.filterDateEnd,
          page: String(this.currentPage),
          pageSize: String(this.pageSize),
          sortField: this.sortField,
          sortDir: this.sortDir,
        })
        const res = await fetch(apiUrl(`/api/logs/login?${q}`), {
          headers: authHeaders(),
          credentials: 'include',
        })
        const json = await res.json()
        if (json.code === 0) {
          this.rows = json.data.rows || []
          this.total = json.data.total || 0
        }
      } catch {
        Alpine.notify?.error('加载登录日志失败')
      } finally {
        this.loading = false
      }
    },

    toggleSort(field) {
      if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      else {
        this.sortField = field
        this.sortDir = 'asc'
      }
      this.fetch()
    },
    search() {
      this.currentPage = 1
      this.fetch()
    },
    reset() {
      this.keyword = ''
      this.filterStatus = ''
      this.filterDateStart = ''
      this.filterDateEnd = ''
      this.currentPage = 1
      this.fetch()
    },
    exportData() {
      Alpine.notify.success(`已导出 ${this.total} 条登录日志`)
    },
  }))

  Alpine.data('opLogPage', () => ({
    keyword: '',
    filterOperator: '',
    filterModule: '',
    filterAction: '',
    filterStatus: '',
    filterDateStart: '',
    filterDateEnd: '',
    currentPage: 1,
    pageSize: 10,
    sortField: 'time',
    sortDir: 'desc',
    rows: [],
    total: 0,
    modules: [],
    actions: [],

    get totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    get paged() {
      return this.rows
    },

    init() {
      this.fetch()
    },

    async fetch() {
      try {
        const q = new URLSearchParams({
          keyword: this.keyword || this.filterOperator,
          module: this.filterModule,
          action: this.filterAction,
          status: this.filterStatus,
          dateStart: this.filterDateStart,
          dateEnd: this.filterDateEnd,
          page: String(this.currentPage),
          pageSize: String(this.pageSize),
          sortField: this.sortField,
          sortDir: this.sortDir,
        })
        const res = await fetch(apiUrl(`/api/logs/ops?${q}`), {
          headers: authHeaders(),
          credentials: 'include',
        })
        const json = await res.json()
        if (json.code === 0) {
          this.rows = json.data.rows || []
          this.total = json.data.total || 0
          this.modules = json.data.modules || []
          this.actions = json.data.actions || []
        }
      } catch {
        Alpine.notify?.error('加载操作日志失败')
      }
    },

    toggleSort(field) {
      if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      else {
        this.sortField = field
        this.sortDir = 'asc'
      }
      this.fetch()
    },
    search() {
      this.currentPage = 1
      this.fetch()
    },
    reset() {
      this.keyword = ''
      this.filterOperator = ''
      this.filterModule = ''
      this.filterAction = ''
      this.filterStatus = ''
      this.filterDateStart = ''
      this.filterDateEnd = ''
      this.currentPage = 1
      this.fetch()
    },
    formatDuration(ms) {
      if (ms >= 1000) return (ms / 1000).toFixed(1) + 's'
      return ms + 'ms'
    },
    statusClass(s) {
      return s === 'Success'
        ? 'bg-green-100 text-green-700'
        : s === 'Warning'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-700'
    },
    statusText(s) {
      return s === 'Success' ? '成功' : s === 'Warning' ? '警告' : '失败'
    },
    exportData() {
      Alpine.notify.success(`已导出 ${this.total} 条操作日志`)
    },
    exportLog() {
      this.exportData()
    },
  }))
}
