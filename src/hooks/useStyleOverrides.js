import { useCallback, useEffect } from 'react'
import { useHistory } from './useHistory'
import { synthesizeCss } from '../utils/cssParser'

export function useStyleOverrides(iframeRef) {
  const [overrides, setOverrides, undo, redo, canUndo, canRedo] =
    useHistory(new Map())

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    let styleEl = doc.getElementById('css-studio-overrides')
    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = 'css-studio-overrides'
      doc.head?.appendChild(styleEl)
    }
    styleEl.textContent = synthesizeCss(overrides)
  }, [overrides, iframeRef])

  const setProperty = useCallback((selector, property, value) => {
    setOverrides(prev => {
      const next = new Map(prev)
      next.set(selector, { ...(next.get(selector) ?? {}), [property]: value })
      return next
    })
  }, [setOverrides])

  const removeProperty = useCallback((selector, property) => {
    setOverrides(prev => {
      const next = new Map(prev)
      const props = { ...(next.get(selector) ?? {}) }
      delete props[property]
      if (Object.keys(props).length === 0) next.delete(selector)
      else next.set(selector, props)
      return next
    })
  }, [setOverrides])

  return { overrides, setProperty, removeProperty, undo, redo, canUndo, canRedo }
}
