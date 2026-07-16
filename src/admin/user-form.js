import { getCsrfToken, setCsrfToken } from '../htmx-setup.js'
import { getToken } from '../auth.js'
import { apiUrl } from '../api-base.js'

export function registerUserForm(Alpine) {
  Alpine.data('userForm', () => ({
    form: {
      username: '',
      phone: '',
      email: '',
      role: '',
      status: '正常',
      dept: '',
      remark: '',
    },
    errors: {},
    submitting: false,
    editId: null,

    init() {
      const id = new URLSearchParams(location.search).get('id')
      if (id) {
        this.editId = id
        this.loadUser(id)
      }
    },

    async loadUser(id) {
      try {
        const res = await fetch(apiUrl(`/api/users/${id}`), {
          headers: { Authorization: `Bearer ${getToken()}` },
          credentials: 'include',
        })
        const json = await res.json()
        if (json.code === 0 && json.data) {
          const u = json.data
          this.form = {
            username: u.username,
            phone: u.phone,
            email: u.email || '',
            role: u.role,
            status: u.status === 'disabled' ? '禁用' : '正常',
            dept: u.dept || '',
            remark: u.remark || '',
          }
        }
      } catch {
        Alpine.notify?.error('加载用户失败')
      }
    },

    validate() {
      this.errors = {}
      if (!this.editId && !this.form.username.trim()) {
        this.errors.username = '请输入用户名'
      }
      if (!this.form.phone.trim()) this.errors.phone = '请输入手机号'
      else if (!/^1[3-9]\d{9}$/.test(this.form.phone.trim())) {
        this.errors.phone = '请输入正确的手机号'
      }
      if (
        this.form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)
      ) {
        this.errors.email = '请输入正确的邮箱'
      }
      if (!this.form.role) this.errors.role = '请选择角色'
      return Object.keys(this.errors).length === 0
    },

    async handleSubmit() {
      if (!this.validate()) return
      this.submitting = true
      const payload = {
        username: this.form.username.trim(),
        phone: this.form.phone.trim(),
        email: this.form.email.trim(),
        role: this.form.role,
        status: this.form.status,
        dept: this.form.dept,
        remark: this.form.remark,
      }
      try {
        const url = this.editId ? apiUrl(`/api/users/${this.editId}`) : apiUrl('/api/users')
        const method = this.editId ? 'PUT' : 'POST'
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            'X-CSRF-Token': getCsrfToken(),
          },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.code !== 0) {
          Alpine.notify.error(json.msg || '保存失败')
          this.submitting = false
          return
        }
        if (json.data?.csrfToken) setCsrfToken(json.data.csrfToken)
        Alpine.notify.success(json.msg || '保存成功')
        const app = Alpine.store('app')
        if (app?._navigateTo) {
          app.addTab('user', '用户管理')
          app._navigateTo('/admin/user.html', '用户管理')
        } else {
          location.href = '/admin/user.html'
        }
      } catch {
        Alpine.notify.error('网络错误')
        this.submitting = false
      }
    },
  }))
}
