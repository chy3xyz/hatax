import { apiUrl } from './api.js'

const WELCOME =
  '你好！我是社区客服。可以帮你快速汇聚博客、论坛、任务、课程和活动里的相关内容。试试下方快捷问题，或直接输入。'

const SUGGESTIONS = ['如何赚积分？', '有哪些课程？', '最近有什么活动？', '论坛怎么发帖？']

export function csChatState() {
  return {
    csOpen: false,
    csInput: '',
    csSending: false,
    csLlm: false,
    csReady: false,
    csSuggestions: SUGGESTIONS,
    csMessages: [{ role: 'assistant', content: WELCOME, sources: [], loading: false }],

    async csEnsureStatus() {
      if (this.csReady) return
      try {
        const res = await fetch(apiUrl('/api/ai/status'))
        const json = await res.json()
        this.csLlm = Boolean(json?.data?.llm)
      } catch {
        this.csLlm = false
      }
      this.csReady = true
    },

    async csToggle() {
      this.csOpen = !this.csOpen
      if (this.csOpen) {
        await this.csEnsureStatus()
        this.$nextTick?.(() => this.csScroll())
      }
    },

    csAsk(text) {
      this.csInput = text
      this.csSend()
    },

    csScroll() {
      const el = this.$refs?.csMessages
      if (el) el.scrollTop = el.scrollHeight
    },

    async csSend() {
      const text = String(this.csInput || '').trim()
      if (!text || this.csSending) return

      this.csMessages.push({ role: 'user', content: text, sources: [], loading: false })
      this.csInput = ''
      this.csSending = true
      const loading = { role: 'assistant', content: '', sources: [], loading: true }
      this.csMessages.push(loading)
      this.$nextTick?.(() => this.csScroll())

      try {
        await this.csEnsureStatus()
        const history = this.csMessages
          .filter((m) => !m.loading && m.content)
          .slice(0, -1)
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }))

        const res = await fetch(apiUrl('/api/ai/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ message: text, history }),
        })
        const json = await res.json()
        if (!res.ok || json.code !== 0) {
          throw new Error(json.msg || `HTTP ${res.status}`)
        }
        loading.content = json.data.reply || '暂无回复'
        loading.sources = json.data.sources || []
        this.csLlm = Boolean(json.data.llm)
      } catch (err) {
        loading.content = `暂时无法回答：${err.message || err}`
        loading.sources = []
      } finally {
        loading.loading = false
        this.csSending = false
        this.$nextTick?.(() => this.csScroll())
      }
    },
  }
}
