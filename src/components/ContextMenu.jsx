import { useEffect, useRef } from 'react'

const ITEMS = [
  { key: 'editText', label: 'Edit text', icon: '✎' },
  { key: 'duplicate', label: 'Duplicate', icon: '⧉' },
  { key: 'moveUp', label: 'Move up', icon: '↑' },
  { key: 'moveDown', label: 'Move down', icon: '↓' },
  { key: 'addSibling', label: 'Add sibling', icon: '+' },
  null,
  { key: 'delete', label: 'Delete', icon: '✕', danger: true },
]

export default function ContextMenu({ x, y, selector, onAction, onClose }) {
  const ref = useRef()

  useEffect(() => {
    function handler(e) { if (!ref.current?.contains(e.target)) onClose() }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} style={{ position:'fixed', top:y, left:x, zIndex:9999 }}
      className="bg-neutral-900 border border-neutral-700 rounded-lg py-1 w-44 shadow-2xl">
      <div className="px-3 py-1 text-[9px] text-neutral-600 font-mono truncate">{selector}</div>
      <div className="my-0.5 border-t border-neutral-800" />
      {ITEMS.map((item, i) =>
        item === null
          ? <div key={i} className="my-0.5 border-t border-neutral-800" />
          : <button key={item.key} onClick={() => { onAction(item.key); onClose() }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${item.danger ? 'text-red-400 hover:bg-red-900/20' : 'text-neutral-300 hover:bg-neutral-800'}`}>
              <span className="text-neutral-500">{item.icon}</span> {item.label}
            </button>
      )}
    </div>
  )
}
