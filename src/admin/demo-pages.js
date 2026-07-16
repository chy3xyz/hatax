import { MENU_GROUPS } from '../menu.js'
import { I18N_MESSAGES } from '../i18n.js'

export function registerDemoPages(Alpine) {
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
        const rows = this.allData.filter(row => {
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
      menus: [],
      expanded: new Set(),
      dirty: false,
      init() {
        this.reloadFromSource(false)
      },
      reloadFromSource(notify = true) {
        const zh = I18N_MESSAGES.zh?.menu || {}
        const en = I18N_MESSAGES.en?.menu || {}
        this.menus = MENU_GROUPS.map((g, gi) => ({
          _uid: 'g-' + g.name,
          key: g.name,
          titleZh: zh[g.name] || g.title || '',
          titleEn: en[g.name] || '',
          path: '#',
          sort: gi + 1,
          visible: true,
          children: (g.items || []).map((it, ii) => ({
            _uid: 'i-' + it.name,
            key: it.name,
            titleZh: zh[it.name] || it.title || '',
            titleEn: en[it.name] || '',
            path: it.path || '',
            sort: ii + 1,
            visible: true,
            children: [],
          })),
        }))
        this.expanded = new Set(this.menus.map((m) => m._uid))
        this.dirty = false
        if (notify) Alpine.notify?.success?.('已从侧栏目录同步')
      },
      get flatRows() {
        const out = []
        const walk = (nodes, depth) => {
          for (const n of nodes) {
            out.push({ ...n, _depth: depth })
            if (n.children?.length && this.expanded.has(n._uid)) walk(n.children, depth + 1)
          }
        }
        walk(this.menus, 0)
        return out
      },
      get leafCount() {
        return this.menus.reduce((n, g) => n + (g.children?.length || 0), 0)
      },
      get missingI18nCount() {
        let c = 0
        const walk = (nodes) => {
          for (const n of nodes) {
            if (!n.titleZh || !n.titleEn) c++
            if (n.children?.length) walk(n.children)
          }
        }
        walk(this.menus)
        return c
      },
      toggle(uid) {
        if (this.expanded.has(uid)) this.expanded.delete(uid)
        else this.expanded.add(uid)
        this.expanded = new Set(this.expanded)
      },
      expandAll() {
        const ids = new Set()
        const walk = (nodes) => {
          for (const n of nodes) {
            ids.add(n._uid)
            if (n.children?.length) walk(n.children)
          }
        }
        walk(this.menus)
        this.expanded = ids
      },
      collapseAll() {
        this.expanded = new Set()
      },
      markDirty() {
        this.dirty = true
      },
      save() {
        if (this.missingI18nCount > 0) {
          Alpine.notify?.warning?.(`仍有 ${this.missingI18nCount} 项缺少中文或英文字段`)
          return
        }
        const apply = (nodes) => {
          for (const n of nodes) {
            I18N_MESSAGES.zh.menu[n.key] = n.titleZh
            I18N_MESSAGES.en.menu[n.key] = n.titleEn
            if (n.children?.length) apply(n.children)
          }
        }
        apply(this.menus)
        Alpine.store('app')?.relocalizeMenus?.()
        this.dirty = false
        Alpine.notify?.success?.('多国语标题已应用（当前会话）')
      },
    }))
    
  }
  