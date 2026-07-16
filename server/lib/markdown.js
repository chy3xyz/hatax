import { esc } from '../views/escape.js'

/**
 * Minimal Markdown → safe HTML (no external deps).
 * Supports: headings, bold/italic, inline code, fenced code, links, lists, paragraphs, hr.
 */
export function mdToHtml(src) {
  const text = String(src || '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const out = []
  let i = 0
  let inCode = false
  let codeLang = ''
  let codeBuf = []
  let listType = null

  const flushList = () => {
    if (!listType) return
    out.push(listType === 'ol' ? '</ol>' : '</ul>')
    listType = null
  }

  const inline = (s) => {
    let t = esc(s)
    t = t.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm">$1</code>')
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    t = t.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" rel="noopener noreferrer" target="_blank">$1</a>',
    )
    return t
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCode) {
        out.push(
          `<pre class="overflow-x-auto rounded-lg bg-gray-900 text-gray-100 p-4 text-sm my-4"><code>${esc(codeBuf.join('\n'))}</code></pre>`,
        )
        codeBuf = []
        inCode = false
        codeLang = ''
      } else {
        flushList()
        inCode = true
        codeLang = line.slice(3).trim()
      }
      i++
      continue
    }

    if (inCode) {
      codeBuf.push(line)
      i++
      continue
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      flushList()
      out.push('<hr class="my-8 border-gray-200 dark:border-gray-800">')
      i++
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushList()
      const level = heading[1].length
      const cls = level === 1 ? 'text-3xl font-bold mt-8 mb-4' : level === 2 ? 'text-2xl font-bold mt-6 mb-3' : 'text-xl font-semibold mt-4 mb-2'
      out.push(`<h${level} class="${cls}">${inline(heading[2])}</h${level}>`)
      i++
      continue
    }

    const ul = line.match(/^[-*]\s+(.+)$/)
    if (ul) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
        out.push('<ul class="list-disc pl-6 my-3 space-y-1">')
      }
      out.push(`<li>${inline(ul[1])}</li>`)
      i++
      continue
    }

    const ol = line.match(/^\d+\.\s+(.+)$/)
    if (ol) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
        out.push('<ol class="list-decimal pl-6 my-3 space-y-1">')
      }
      out.push(`<li>${inline(ol[1])}</li>`)
      i++
      continue
    }

    if (!line.trim()) {
      flushList()
      i++
      continue
    }

    flushList()
    out.push(`<p class="my-3 leading-relaxed text-gray-700 dark:text-gray-300">${inline(line)}</p>`)
    i++
  }

  if (inCode) {
    out.push(
      `<pre class="overflow-x-auto rounded-lg bg-gray-900 text-gray-100 p-4 text-sm my-4"><code>${esc(codeBuf.join('\n'))}</code></pre>`,
    )
  }
  flushList()
  return out.join('\n')
}
