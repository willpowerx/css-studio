import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import LayoutTab from './tabs/LayoutTab'
import TypeTab from './tabs/TypeTab'
import ColorTab from './tabs/ColorTab'
import FxTab from './tabs/FxTab'
import { usePanelResize } from '../hooks/usePanelResize'

const TABS = ['Layout', 'Type', 'Color', 'FX']

export default function PropertiesPanel({ selector, styles = {}, overrides, tokens, setProperty, onCollapse }) {
  const [tab, setTab] = useState('Layout')
  const [width, dragHandleRef] = usePanelResize('css-studio:props-width', 260, 200, 520, 'left')

  const selectorOverrides = overrides?.get(selector) ?? {}

  return (
    <div className="relative bg-neutral-900 border-l border-neutral-800 flex-shrink-0 flex flex-col" style={{ width }}>
      {/* Drag handle — left edge */}
      <div
        ref={dragHandleRef}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize bg-neutral-800 hover:bg-blue-500/50 active:bg-blue-500/70 z-10 transition-colors"
      />
      {!selector ? (
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center justify-end">
            <button onClick={onCollapse} title="Collapse panel" className="text-neutral-600 hover:text-neutral-300">
              <ChevronRight size={10} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-neutral-600 text-center px-4">Click any element in the preview to start editing</p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-3 py-2 border-b border-neutral-800 text-[10px] text-neutral-500 font-mono bg-neutral-950 flex items-center gap-1">
            <span className="truncate flex-1">{selector}</span>
            <button onClick={onCollapse} title="Collapse panel" className="flex-shrink-0 text-neutral-600 hover:text-neutral-300">
              <ChevronRight size={10} />
            </button>
          </div>
          <div className="flex border-b border-neutral-800">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-[10px] py-2 transition-colors ${tab === t ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {tab === 'Layout' && <LayoutTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
            {tab === 'Type' && <TypeTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
            {tab === 'Color' && <ColorTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
            {tab === 'FX' && <FxTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
          </div>
          <div className="border-t border-neutral-800 bg-neutral-950 px-3 py-2 flex-shrink-0">
            <div className="text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Generated CSS</div>
            <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
              {Object.entries(selectorOverrides).filter(([,v]) => v)
                .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join('\n')
                || '/* no overrides yet */'}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
