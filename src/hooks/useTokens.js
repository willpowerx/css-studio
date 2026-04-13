import { useCallback, useState } from 'react'
import { parseTokensFromHtml } from '../utils/cssParser'

export function useTokens(iframeRef) {
  const [tokens, setTokens] = useState([])

  const loadFromHtml = useCallback((html) => {
    setTokens(parseTokensFromHtml(html))
  }, [])

  const patchIframeRoot = useCallback((updatedTokens) => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    let styleEl = doc.getElementById('css-studio-tokens')
    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = 'css-studio-tokens'
      doc.head?.appendChild(styleEl)
    }
    styleEl.textContent = `:root {\n${updatedTokens.map(t => `  ${t.name}: ${t.value};`).join('\n')}\n}`
  }, [iframeRef])

  const upsertToken = useCallback((name, value, type = 'other') => {
    setTokens(prev => {
      const idx = prev.findIndex(t => t.name === name)
      const next = idx >= 0
        ? prev.map((t, i) => i === idx ? { name, value, type } : t)
        : [...prev, { name, value, type }]
      patchIframeRoot(next)
      return next
    })
  }, [patchIframeRoot])

  const deleteToken = useCallback((name) => {
    setTokens(prev => {
      const next = prev.filter(t => t.name !== name)
      patchIframeRoot(next)
      return next
    })
  }, [patchIframeRoot])

  return { tokens, loadFromHtml, upsertToken, deleteToken }
}
