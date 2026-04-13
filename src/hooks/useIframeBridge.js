import { useCallback, useEffect } from 'react'
import { getEditableStyles } from '../utils/cssParser'

export function useIframeBridge(iframeRef, onSelect) {
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== 'css-studio-select') return
      const doc = iframeRef.current?.contentDocument
      if (!doc) return
      const el = doc.querySelector(e.data.selector)
      if (!el) { onSelect(e.data.selector, {}); return }
      onSelect(e.data.selector, getEditableStyles(el, doc.defaultView.getComputedStyle(el)))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframeRef, onSelect])
}
