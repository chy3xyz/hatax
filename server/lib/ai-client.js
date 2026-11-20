import { config } from '../config.js'

export function aiStatus() {
  return {
    enabled: true,
    llm: Boolean(config.aiApiKey),
    model: config.aiApiKey ? config.aiModel : null,
    provider: config.aiApiKey ? config.aiBaseUrl : null,
  }
}

/**
 * OpenAI-compatible chat completions (OpenAI / DeepSeek / Ollama / etc.).
 * Returns assistant text or null on failure.
 */
export async function completeWithLlm({ system, user, history = [] }) {
  if (!config.aiApiKey) return null

  const messages = [{ role: 'system', content: system }]
  for (const m of history.slice(-6)) {
    if (!m?.role || !m?.content) continue
    if (m.role !== 'user' && m.role !== 'assistant') continue
    messages.push({ role: m.role, content: String(m.content).slice(0, 2000) })
  }
  messages.push({ role: 'user', content: String(user).slice(0, 4000) })

  const url = `${config.aiBaseUrl.replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.aiModel,
      temperature: 0.3,
      max_tokens: 800,
      messages,
    }),
    signal: AbortSignal.timeout(config.aiTimeoutMs),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  return content ? String(content).trim() : null
}
