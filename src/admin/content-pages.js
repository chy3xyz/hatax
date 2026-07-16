import { apiUrl } from '../api-base.js'

async function api(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('hatax_token') || ''}`,
    ...(options.headers || {}),
  }
  const method = (options.method || 'GET').toUpperCase()
  if (options.body) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = sessionStorage.getItem('hatax_csrf') || ''
  }
  const res = await fetch(apiUrl(path), { ...options, headers, credentials: 'include' })
  return res.json()
}

export function registerContentPages(Alpine) {
  Alpine.data('dashboardPage', () => ({
    loading: true,
    blog: {},
    forum: {},
    courses: {},
    events: {},
    tasks: {},
    ops: [],
    async init() {
      await this.load()
      window._pageRefreshFns = window._pageRefreshFns || {}
      window._pageRefreshFns.dashboard = () => this.load()
    },
    async load() {
      this.loading = true
      const [b, f, c, e, t, logs] = await Promise.all([
        api('/api/blog/stats'),
        api('/api/forum/stats'),
        api('/api/courses/stats'),
        api('/api/events/stats'),
        api('/api/tasks/stats'),
        api('/api/logs/ops?pageSize=12'),
      ])
      if (b.code === 0) this.blog = b.data || {}
      if (f.code === 0) this.forum = f.data || {}
      if (c.code === 0) this.courses = c.data || {}
      if (e.code === 0) this.events = e.data || {}
      if (t.code === 0) this.tasks = t.data || {}
      if (logs.code === 0) this.ops = logs.data?.rows || []
      this.loading = false
    },
  }))

  Alpine.data('blogAdminPage', () => ({
    rows: [],
    total: 0,
    q: '',
    status: '',
    authorKind: '',
    modalOpen: false,
    saving: false,
    form: emptyPost(),
    async init() {
      await this.load()
      this.$el.addEventListener('click', (e) => {
        const edit = e.target.closest('[data-edit-post]')
        const del = e.target.closest('[data-del-post]')
        if (edit) this.edit(Number(edit.dataset.editPost))
        if (del) this.remove(Number(del.dataset.delPost))
      })
    },
    async load() {
      const params = new URLSearchParams({ admin: '1', pageSize: '50' })
      if (this.q) params.set('q', this.q)
      if (this.status) params.set('status', this.status)
      if (this.authorKind) params.set('authorKind', this.authorKind)
      const json = await api('/api/blog/posts?' + params)
      if (json.code === 0) {
        this.rows = json.data.rows || []
        this.total = json.data.total || 0
      }
    },
    openCreate() {
      this.form = emptyPost()
      this.modalOpen = true
    },
    edit(id) {
      const p = this.rows.find((r) => r.id === id)
      if (!p) return
      this.form = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || '',
        bodyMd: p.bodyMd || '',
        status: p.status,
        featured: p.featured ? '1' : '0',
        tags: (p.tags || []).map((t) => t.slug).join(', '),
        authorKind: p.authorKind || 'admin',
      }
      this.modalOpen = true
    },
    async save() {
      this.saving = true
      const payload = {
        title: this.form.title,
        slug: this.form.slug,
        excerpt: this.form.excerpt,
        bodyMd: this.form.bodyMd,
        status: this.form.status,
        featured: this.form.featured === '1' || this.form.featured === true,
        tags: this.form.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      const json = this.form.id
        ? await api('/api/blog/posts/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/blog/posts', { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.(this.form.id ? '已更新' : '已创建')
      this.modalOpen = false
      await this.load()
    },
    async remove(id) {
      if (!confirm('确认删除该博客？')) return
      const json = await api('/api/blog/posts/' + id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
  }))

  Alpine.data('forumAdminPage', () => ({
    rows: [],
    categories: [],
    tags: [],
    category: '',
    tag: '',
    q: '',
    modalOpen: false,
    replyOpen: false,
    saving: false,
    form: emptyTopic(),
    replies: [],
    replyTopicId: null,
    async init() {
      const [cats, tags] = await Promise.all([api('/api/forum/categories'), api('/api/forum/tags')])
      if (cats.code === 0) this.categories = cats.data || []
      if (tags.code === 0) this.tags = tags.data || []
      await this.load()
      this.$el.addEventListener('click', (e) => {
        const pin = e.target.closest('[data-pin-topic]')
        const lock = e.target.closest('[data-lock-topic]')
        const del = e.target.closest('[data-del-topic]')
        const edit = e.target.closest('[data-edit-topic]')
        const replies = e.target.closest('[data-replies-topic]')
        if (pin) this.togglePin(Number(pin.dataset.pinTopic), pin.dataset.pinned === '1')
        if (lock) this.toggleLock(Number(lock.dataset.lockTopic), lock.dataset.locked === '1')
        if (del) this.remove(Number(del.dataset.delTopic))
        if (edit) this.openEdit(Number(edit.dataset.editTopic))
        if (replies) this.openReplies(Number(replies.dataset.repliesTopic))
      })
    },
    async load() {
      const params = new URLSearchParams({ pageSize: '50' })
      if (this.category) params.set('category', this.category)
      if (this.tag) params.set('tag', this.tag)
      if (this.q) params.set('q', this.q)
      const json = await api('/api/forum/topics?' + params)
      if (json.code === 0) this.rows = json.data.rows || []
    },
    openEdit(id) {
      const t = this.rows.find((r) => r.id === id)
      if (!t) return
      this.form = {
        id: t.id,
        title: t.title,
        bodyMd: t.bodyMd || '',
        categoryId: String(t.categoryId),
        tags: (t.tags || []).map((x) => x.slug).join(', '),
        pinned: t.pinned,
        locked: t.locked,
      }
      this.modalOpen = true
    },
    async saveTopic() {
      this.saving = true
      const json = await api('/api/forum/topics/' + this.form.id, {
        method: 'PUT',
        body: JSON.stringify({
          title: this.form.title,
          bodyMd: this.form.bodyMd,
          categoryId: Number(this.form.categoryId),
          tags: this.form.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          pinned: this.form.pinned,
          locked: this.form.locked,
        }),
      })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('帖子已更新')
      this.modalOpen = false
      await this.load()
    },
    async openReplies(id) {
      this.replyTopicId = id
      this.replyOpen = true
      const json = await api('/api/forum/topics/' + id)
      this.replies = json.code === 0 ? json.data?.replies || [] : []
    },
    async deleteReply(id) {
      if (!confirm('确认删除该回复？')) return
      const json = await api('/api/forum/replies/' + id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除回复')
      await this.openReplies(this.replyTopicId)
      await this.load()
    },
    async togglePin(id, pinned) {
      const json = await api('/api/forum/topics/' + id, {
        method: 'PUT',
        body: JSON.stringify({ pinned: !pinned }),
      })
      if (json.code === 0) {
        Alpine.notify?.success?.(pinned ? '已取消置顶' : '已置顶')
        await this.load()
      }
    },
    async toggleLock(id, locked) {
      const json = await api('/api/forum/topics/' + id, {
        method: 'PUT',
        body: JSON.stringify({ locked: !locked }),
      })
      if (json.code === 0) {
        Alpine.notify?.success?.(locked ? '已解锁' : '已锁定')
        await this.load()
      }
    },
    async remove(id) {
      if (!confirm('确认删除该帖子及其回复？')) return
      const json = await api('/api/forum/topics/' + id, { method: 'DELETE' })
      if (json.code === 0) {
        Alpine.notify?.success?.('已删除')
        await this.load()
      }
    },
  }))

  Alpine.data('membersAdminPage', () => ({
    rows: [],
    total: 0,
    q: '',
    status: '',
    pointsOpen: false,
    pointsForm: { id: null, username: '', delta: 10, reason: '后台奖励' },
    historyOpen: false,
    historyMember: null,
    historyLogs: [],
    historyPoints: 0,
    async init() {
      await this.load()
    },
    async load() {
      const params = new URLSearchParams({ pageSize: '50' })
      if (this.q) params.set('q', this.q)
      if (this.status) params.set('status', this.status)
      const json = await api('/api/community/admin/members?' + params)
      if (json.code === 0) {
        this.rows = json.data.rows || []
        this.total = json.data.total || 0
      }
    },
    async toggleStatus(m) {
      const next = m.status === 'disabled' ? 'active' : 'disabled'
      if (!confirm(next === 'disabled' ? `禁用 @${m.username}？` : `启用 @${m.username}？`)) return
      const json = await api('/api/community/admin/members/' + m.id + '/status', {
        method: 'PUT',
        body: JSON.stringify({ status: next }),
      })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '操作失败')
        return
      }
      Alpine.notify?.success?.(next === 'disabled' ? '已禁用' : '已启用')
      await this.load()
    },
    openPoints(m) {
      this.pointsForm = { id: m.id, username: m.username, delta: 10, reason: '后台奖励' }
      this.pointsOpen = true
    },
    async savePoints() {
      const json = await api('/api/community/admin/members/' + this.pointsForm.id + '/points', {
        method: 'POST',
        body: JSON.stringify({
          delta: Number(this.pointsForm.delta),
          reason: this.pointsForm.reason,
        }),
      })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '调整失败')
        return
      }
      Alpine.notify?.success?.('积分已调整')
      this.pointsOpen = false
      await this.load()
    },
    async openHistory(m) {
      this.historyMember = m
      this.historyOpen = true
      this.historyLogs = []
      const json = await api('/api/community/admin/members/' + m.id + '/points?limit=50')
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '加载失败')
        return
      }
      this.historyPoints = json.data?.points ?? m.points
      this.historyLogs = json.data?.logs || []
    },
  }))

  Alpine.data('forumCategoriesPage', () => ({
    rows: [],
    modalOpen: false,
    saving: false,
    form: emptyCategory(),
    async init() {
      await this.load()
    },
    async load() {
      const json = await api('/api/forum/categories')
      if (json.code === 0) this.rows = json.data || []
    },
    openCreate() {
      this.form = emptyCategory()
      this.modalOpen = true
    },
    edit(c) {
      this.form = {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        color: c.color || '#1890ff',
        sort: c.sort || 0,
      }
      this.modalOpen = true
    },
    async save() {
      this.saving = true
      const payload = {
        name: this.form.name,
        slug: this.form.slug,
        description: this.form.description,
        color: this.form.color,
        sort: Number(this.form.sort || 0),
      }
      const json = this.form.id
        ? await api('/api/forum/categories/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/forum/categories', { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('已保存')
      this.modalOpen = false
      await this.load()
    },
    async remove(c) {
      if (!confirm(`删除分区「${c.name}」？`)) return
      const json = await api('/api/forum/categories/' + c.id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
  }))

  Alpine.data('tagsAdminPage', () => ({
    tab: 'forum',
    forumTags: [],
    blogTags: [],
    modalOpen: false,
    saving: false,
    form: emptyTag(),
    async init() {
      await this.load()
    },
    async load() {
      const [f, b] = await Promise.all([api('/api/forum/tags'), api('/api/blog/tags')])
      if (f.code === 0) this.forumTags = f.data || []
      if (b.code === 0) this.blogTags = b.data || []
    },
    openCreate() {
      this.form = emptyTag(this.tab)
      this.modalOpen = true
    },
    edit(t) {
      this.form = {
        id: t.id,
        kind: this.tab,
        name: t.name,
        slug: t.slug,
        color: t.color || '#64748b',
        description: t.description || '',
      }
      this.modalOpen = true
    },
    async save() {
      this.saving = true
      const base = this.form.kind === 'blog' ? '/api/blog/tags' : '/api/forum/tags'
      const payload = {
        name: this.form.name,
        slug: this.form.slug,
        description: this.form.description,
        color: this.form.color,
      }
      const json = this.form.id
        ? await api(base + '/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api(base, { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('已保存')
      this.modalOpen = false
      await this.load()
    },
    async remove(t) {
      if (!confirm(`删除标签「${t.name}」？`)) return
      const base = this.tab === 'blog' ? '/api/blog/tags' : '/api/forum/tags'
      const json = await api(base + '/' + t.id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
  }))

  Alpine.data('tasksAdminPage', () => ({
    rows: [],
    type: '',
    status: '',
    q: '',
    stats: {},
    modalOpen: false,
    saving: false,
    form: emptyAdminTask(),
    completionsOpen: false,
    completions: [],
    completionsTitle: '',
    types: [
      { key: 'read', label: '阅读文章' },
      { key: 'video', label: '观看视频' },
      { key: 'audio', label: '收听音频' },
      { key: 'quiz', label: '答题测验' },
      { key: 'post', label: '论坛发帖' },
    ],
    async init() {
      await this.load()
    },
    async load() {
      const params = new URLSearchParams()
      if (this.type) params.set('type', this.type)
      if (this.status) params.set('status', this.status)
      if (this.q) params.set('q', this.q)
      const [list, st] = await Promise.all([
        api('/api/tasks/admin?' + params),
        api('/api/tasks/stats'),
      ])
      if (list.code === 0) this.rows = list.data || []
      if (st.code === 0) this.stats = st.data || {}
    },
    openCreate() {
      this.form = emptyAdminTask()
      this.modalOpen = true
    },
    edit(t) {
      this.form = {
        id: t.id,
        title: t.title,
        slug: t.slug,
        description: t.description || '',
        type: t.type,
        rewardPoints: t.rewardPoints,
        status: t.status,
        sort: t.sort,
        repeatable: !!t.repeatable,
        configText: JSON.stringify(t.config || {}, null, 2),
      }
      this.modalOpen = true
    },
    async save() {
      let config = {}
      try {
        config = JSON.parse(this.form.configText || '{}')
      } catch {
        Alpine.notify?.error?.('配置 JSON 格式错误')
        return
      }
      this.saving = true
      const payload = {
        title: this.form.title,
        slug: this.form.slug,
        description: this.form.description,
        type: this.form.type,
        rewardPoints: Number(this.form.rewardPoints || 0),
        status: this.form.status,
        sort: Number(this.form.sort || 0),
        repeatable: !!this.form.repeatable,
        config,
      }
      const json = this.form.id
        ? await api('/api/tasks/admin/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/tasks/admin', { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('已保存')
      this.modalOpen = false
      await this.load()
    },
    async remove(t) {
      if (!confirm(`删除任务「${t.title}」？`)) return
      const json = await api('/api/tasks/admin/' + t.id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
    async viewCompletions(t = null) {
      this.completionsTitle = t ? t.title : '全部任务完成记录'
      this.completionsOpen = true
      const path = t
        ? `/api/tasks/admin/${t.id}/completions?limit=100`
        : '/api/tasks/admin/completions?limit=50'
      const json = await api(path)
      this.completions = json.code === 0 ? json.data || [] : []
      if (json.code !== 0) Alpine.notify?.error?.(json.msg || '加载失败')
    },
  }))

  Alpine.data('coursesAdminPage', () => ({
    rows: [],
    type: '',
    status: '',
    q: '',
    stats: {},
    modalOpen: false,
    saving: false,
    form: emptyAdminCourse(),
    purchasesOpen: false,
    purchases: [],
    purchasesTitle: '',
    async init() {
      await this.load()
    },
    async load() {
      const params = new URLSearchParams()
      if (this.type) params.set('type', this.type)
      if (this.status) params.set('status', this.status)
      if (this.q) params.set('q', this.q)
      const [list, st] = await Promise.all([
        api('/api/courses/admin?' + params),
        api('/api/courses/stats'),
      ])
      if (list.code === 0) this.rows = list.data || []
      if (st.code === 0) this.stats = st.data || {}
    },
    openCreate() {
      this.form = emptyAdminCourse()
      this.modalOpen = true
    },
    addLesson() {
      this.form.lessons.push(emptyAdminLesson(this.form.lessons.length))
    },
    async edit(c) {
      const json = await api('/api/courses/admin/' + c.id)
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '加载失败')
        return
      }
      const d = json.data
      this.form = {
        id: d.id,
        title: d.title,
        subtitle: d.subtitle || '',
        slug: d.slug || '',
        coverUrl: d.coverUrl || '',
        type: d.type,
        pricePoints: d.pricePoints,
        status: d.status,
        sort: d.sort,
        summary: d.summary || '',
        introMd: d.introMd || '',
        bodyMd: d.bodyMd || '',
        lessons: (d.lessons || []).map((l) => ({
          id: l.id,
          title: l.title,
          contentType: l.contentType,
          mediaUrl: l.mediaUrl || '',
          bodyMd: l.bodyMd || '',
          durationMinutes: l.durationMinutes || 0,
          isFree: !!l.isFree,
          sort: l.sort || 0,
        })),
      }
      this.modalOpen = true
    },
    async save() {
      this.saving = true
      const payload = {
        title: this.form.title,
        subtitle: this.form.subtitle,
        slug: this.form.slug,
        coverUrl: this.form.coverUrl,
        type: this.form.type,
        pricePoints: Number(this.form.pricePoints || 0),
        status: this.form.status,
        sort: Number(this.form.sort || 0),
        summary: this.form.summary,
        introMd: this.form.introMd,
        bodyMd: this.form.bodyMd,
        lessons: (this.form.lessons || []).map((l, i) => ({
          id: l.id || undefined,
          title: l.title,
          contentType: l.contentType,
          mediaUrl: l.mediaUrl,
          bodyMd: l.bodyMd,
          durationMinutes: Number(l.durationMinutes || 0),
          isFree: !!l.isFree,
          sort: Number(l.sort ?? i),
        })),
      }
      const json = this.form.id
        ? await api('/api/courses/admin/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/courses/admin', { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('已保存')
      this.modalOpen = false
      await this.load()
    },
    async remove(c) {
      if (!confirm(`删除课程「${c.title}」？课时与购买记录将一并清除。`)) return
      const json = await api('/api/courses/admin/' + c.id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
    async viewPurchases(c = null) {
      this.purchasesTitle = c ? c.title : '全部购买记录'
      this.purchasesOpen = true
      const path = c
        ? `/api/courses/admin/${c.id}/purchases?limit=100`
        : '/api/courses/admin/purchases?limit=50'
      const json = await api(path)
      this.purchases = json.code === 0 ? json.data || [] : []
      if (json.code !== 0) Alpine.notify?.error?.(json.msg || '加载失败')
    },
  }))

  Alpine.data('eventsAdminPage', () => ({
    rows: [],
    category: '',
    status: '',
    q: '',
    stats: {},
    modalOpen: false,
    saving: false,
    form: emptyAdminEvent(),
    signupsOpen: false,
    signups: [],
    signupsEventId: null,
    signupsEventTitle: '',
    categories: [
      { key: 'conference', label: '产业大会' },
      { key: 'healing', label: '疗愈活动' },
      { key: 'online', label: '线上大会' },
      { key: 'meetup', label: '线下沙龙' },
      { key: 'other', label: '其他活动' },
    ],
    async init() {
      await this.load()
    },
    async load() {
      const params = new URLSearchParams()
      if (this.category) params.set('category', this.category)
      if (this.status) params.set('status', this.status)
      if (this.q) params.set('q', this.q)
      const [list, st] = await Promise.all([
        api('/api/events/admin?' + params),
        api('/api/events/stats'),
      ])
      if (list.code === 0) this.rows = list.data || []
      if (st.code === 0) this.stats = st.data || {}
    },
    openCreate() {
      this.form = emptyAdminEvent()
      this.modalOpen = true
    },
    async edit(e) {
      const json = await api('/api/events/admin/' + e.id)
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '加载失败')
        return
      }
      const d = json.data
      this.form = {
        id: d.id,
        title: d.title,
        subtitle: d.subtitle || '',
        slug: d.slug || '',
        category: d.category,
        mode: d.mode,
        location: d.location || '',
        onlineUrl: d.onlineUrl || '',
        startsAt: d.startsAt || '',
        endsAt: d.endsAt || '',
        signupDeadline: d.signupDeadline || '',
        capacity: d.capacity || 0,
        feePoints: d.feePoints || 0,
        status: d.status,
        sort: d.sort || 0,
        summary: d.summary || '',
        bodyMd: d.bodyMd || '',
      }
      this.modalOpen = true
    },
    async save() {
      this.saving = true
      const payload = {
        title: this.form.title,
        subtitle: this.form.subtitle,
        slug: this.form.slug,
        category: this.form.category,
        mode: this.form.mode,
        location: this.form.location,
        onlineUrl: this.form.onlineUrl,
        startsAt: this.form.startsAt,
        endsAt: this.form.endsAt,
        signupDeadline: this.form.signupDeadline,
        capacity: Number(this.form.capacity || 0),
        feePoints: Number(this.form.feePoints || 0),
        status: this.form.status,
        sort: Number(this.form.sort || 0),
        summary: this.form.summary,
        bodyMd: this.form.bodyMd,
      }
      const json = this.form.id
        ? await api('/api/events/admin/' + this.form.id, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/events/admin', { method: 'POST', body: JSON.stringify(payload) })
      this.saving = false
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '保存失败')
        return
      }
      Alpine.notify?.success?.('已保存')
      this.modalOpen = false
      await this.load()
    },
    async remove(e) {
      if (!confirm(`删除活动「${e.title}」？报名记录将一并清除。`)) return
      const json = await api('/api/events/admin/' + e.id, { method: 'DELETE' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '删除失败')
        return
      }
      Alpine.notify?.success?.('已删除')
      await this.load()
    },
    async viewSignups(e) {
      this.signupsEventId = e.id
      this.signupsEventTitle = e.title
      const json = await api('/api/events/admin/' + e.id + '/signups')
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '加载失败')
        return
      }
      this.signups = json.data || []
      this.signupsOpen = true
    },
    async cancelSignup(s) {
      if (!confirm(`取消 ${s.contactName || s.displayName} 的报名？`)) return
      const json = await api('/api/events/admin/signups/' + s.id + '/cancel', { method: 'POST', body: '{}' })
      if (json.code !== 0) {
        Alpine.notify?.error?.(json.msg || '取消失败')
        return
      }
      Alpine.notify?.success?.('已取消报名')
      if (this.signupsEventId) {
        await this.viewSignups({ id: this.signupsEventId, title: this.signupsEventTitle })
      }
      await this.load()
    },
    exportSignupsCsv() {
      if (!this.signups.length) {
        Alpine.notify?.warning?.('暂无报名数据')
        return
      }
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const lines = [['姓名', '手机', '用户名', '昵称', '备注', '消耗积分', '报名时间'].map(esc).join(',')]
      for (const s of this.signups) {
        lines.push(
          [s.contactName, s.contactPhone, s.username, s.displayName, s.note, s.pointsSpent, s.createdAt]
            .map(esc)
            .join(','),
        )
      }
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `signups-${this.signupsEventId || 'event'}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    },
  }))
}

function emptyPost() {
  return {
    id: null,
    title: '',
    slug: '',
    excerpt: '',
    bodyMd: '',
    status: 'draft',
    featured: '0',
    tags: '',
    authorKind: 'admin',
  }
}

function emptyTopic() {
  return {
    id: null,
    title: '',
    bodyMd: '',
    categoryId: '',
    tags: '',
    pinned: false,
    locked: false,
  }
}

function emptyCategory() {
  return { id: null, name: '', slug: '', description: '', color: '#1890ff', sort: 0 }
}

function emptyTag(kind = 'forum') {
  return { id: null, kind, name: '', slug: '', color: '#64748b', description: '' }
}

function emptyAdminTask() {
  return {
    id: null,
    title: '',
    slug: '',
    description: '',
    type: 'read',
    rewardPoints: 5,
    status: 'active',
    sort: 0,
    repeatable: false,
    configText: JSON.stringify(
      { url: '/pages/blog.html', minSeconds: 30 },
      null,
      2,
    ),
  }
}

function emptyAdminLesson(sort = 0) {
  return {
    id: null,
    title: '',
    contentType: 'article',
    mediaUrl: '',
    bodyMd: '',
    durationMinutes: 0,
    isFree: false,
    sort,
  }
}

function emptyAdminCourse() {
  return {
    id: null,
    title: '',
    subtitle: '',
    slug: '',
    coverUrl: '',
    type: 'article',
    pricePoints: 10,
    status: 'published',
    sort: 0,
    summary: '',
    introMd: '',
    bodyMd: '',
    lessons: [emptyAdminLesson(0)],
  }
}

function emptyAdminEvent() {
  const y = new Date().getFullYear()
  return {
    id: null,
    title: '',
    subtitle: '',
    slug: '',
    category: 'conference',
    mode: 'offline',
    location: '',
    onlineUrl: '',
    startsAt: `${y}-09-01 09:30:00`,
    endsAt: `${y}-09-01 17:00:00`,
    signupDeadline: '',
    capacity: 50,
    feePoints: 0,
    status: 'published',
    sort: 0,
    summary: '',
    bodyMd: '',
  }
}
