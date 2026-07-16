/**
 * Toast notifications — XSS-safe (textContent only for user strings).
 */
export function registerNotify(Alpine) {
  Alpine.notify = {
    container: null,

    init() {
      this.container = document.createElement('div')
      this.container.className = 'fixed top-4 right-4 z-[99999] space-y-2 w-80'
      this.container.setAttribute('aria-live', 'polite')
      this.container.setAttribute('role', 'status')
      document.body.appendChild(this.container)
    },

    create(type, content, opts = {}) {
      if (!this.container) this.init()
      const { duration = 3500, title = '' } = opts
      const cfg = {
        success: { bg: 'bg-emerald-500', icon: 'M5 13l4 4L19 7', label: 'Success' },
        error: { bg: 'bg-red-500', icon: 'M6 18L18 6M6 6l12 12', label: 'Error' },
        warning: {
          bg: 'bg-amber-500',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          label: 'Warning',
        },
        info: {
          bg: 'bg-blue-500',
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Info',
        },
      }
      const c = cfg[type] || cfg.info

      const el = document.createElement('div')
      el.className = `notify-item ${c.bg} text-white rounded-lg shadow-2xl overflow-hidden transform translate-x-full transition-transform duration-300`

      const row = document.createElement('div')
      row.className = 'flex items-start gap-3 p-4'

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'w-5 h-5 flex-shrink-0 mt-0.5')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', 'currentColor')
      svg.setAttribute('viewBox', '0 0 24 24')
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('stroke-linejoin', 'round')
      path.setAttribute('stroke-width', '2')
      path.setAttribute('d', c.icon)
      svg.appendChild(path)

      const body = document.createElement('div')
      body.className = 'flex-1 min-w-0'
      if (title) {
        const titleEl = document.createElement('div')
        titleEl.className = 'font-semibold text-sm mb-0.5'
        titleEl.textContent = String(title)
        body.appendChild(titleEl)
      }
      const contentEl = document.createElement('div')
      contentEl.className = 'text-sm opacity-90'
      contentEl.textContent = String(content ?? '')
      body.appendChild(contentEl)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'opacity-60 hover:opacity-100 flex-shrink-0'
      closeBtn.setAttribute('aria-label', 'Close')
      closeBtn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
      closeBtn.addEventListener('click', () => this.remove(el))

      row.appendChild(svg)
      row.appendChild(body)
      row.appendChild(closeBtn)

      const progressWrap = document.createElement('div')
      progressWrap.className = 'h-1 bg-white/20'
      const progressBar = document.createElement('div')
      progressBar.className = 'h-full bg-white/40 progress-bar'
      progressBar.style.animation = `notify-progress ${duration}ms linear forwards`
      progressWrap.appendChild(progressBar)

      el.appendChild(row)
      el.appendChild(progressWrap)
      this.container.appendChild(el)
      requestAnimationFrame(() => {
        el.classList.remove('translate-x-full')
      })
      el._timer = setTimeout(() => this.remove(el), duration)
    },

    remove(el) {
      if (!el || !el.parentNode) return
      clearTimeout(el._timer)
      el.classList.add('translate-x-full')
      setTimeout(() => el.remove(), 300)
    },

    success(content, opts) {
      this.create('success', content, opts)
    },
    error(content, opts) {
      this.create('error', content, opts)
    },
    warning(content, opts) {
      this.create('warning', content, opts)
    },
    info(content, opts) {
      this.create('info', content, opts)
    },
  }

  Alpine.message = Alpine.notify
}
