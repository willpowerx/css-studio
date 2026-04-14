import { useState, useRef, useCallback } from 'react'

/**
 * usePanelResize — drag-to-resize with localStorage persistence.
 *
 * @param {string} storageKey  localStorage key for persisting width
 * @param {number} defaultWidth  fallback width in px
 * @param {number} min  minimum width in px
 * @param {number} max  maximum width in px
 * @param {'right'|'left'} direction
 *   'right' — dragging right increases width (Layers panel, handle on right edge)
 *   'left'  — dragging left increases width (Properties panel, handle on left edge)
 * @returns {[number, (el: HTMLElement|null) => void]}  [width, dragHandleRef]
 */
export function usePanelResize(storageKey, defaultWidth, min, max, direction) {
  const [width, setWidth] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey)
      if (v !== null) {
        const n = parseInt(v, 10)
        if (!isNaN(n)) return Math.min(max, Math.max(min, n))
      }
    } catch {}
    return defaultWidth
  })

  // stateRef holds mutable drag state — avoids stale closures in event listeners
  const stateRef = useRef({ width, dragStart: null })
  stateRef.current.width = width

  const handleRef = useCallback((el) => {
    if (!el) return

    function onPointerDown(e) {
      e.preventDefault()
      stateRef.current.dragStart = { x: e.clientX, w: stateRef.current.width }
      el.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e) {
      if (!stateRef.current.dragStart) return
      const { x, w } = stateRef.current.dragStart
      const delta = direction === 'right' ? e.clientX - x : x - e.clientX
      const next = Math.min(max, Math.max(min, w + delta))
      stateRef.current.width = next
      setWidth(next)
    }

    function onPointerUp() {
      if (!stateRef.current.dragStart) return
      stateRef.current.dragStart = null
      try { localStorage.setItem(storageKey, String(stateRef.current.width)) } catch {}
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
  }, []) // stable — reads stateRef at call time, not closure values

  return [width, handleRef]
}
