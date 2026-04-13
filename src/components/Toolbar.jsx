import { useRef, useState } from 'react'
import { Upload, Clipboard, Layers, Download, FolderOpen, Loader2 } from 'lucide-react'
import { loadProject } from '../utils/projectLoader'

export default function Toolbar({ onLoadHtml, layersOpen, onToggleLayers, onExport, canUndo, canRedo, onUndo, onRedo }) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const folderRef = useRef()

  // webkitdirectory is non-standard — set imperatively to avoid JSX stripping it
  const folderCallbackRef = (el) => {
    folderRef.current = el
    if (el) el.setAttribute('webkitdirectory', '')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onLoadHtml(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleApply() {
    if (pasteValue.trim()) onLoadHtml(pasteValue.trim())
    setPasteOpen(false)
    setPasteValue('')
  }

  async function handleFolder(e) {
    const files = e.target.files
    if (!files?.length) return
    setLoading(true)
    try {
      onLoadHtml(await loadProject(files))
    } catch (err) {
      console.error('[CSS Studio] Project load failed:', err.message)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 gap-3 flex-shrink-0">
        <span className="text-xs font-bold tracking-widest text-neutral-200 mr-1">CSS STUDIO</span>
        <div className="h-4 w-px bg-neutral-700" />
        <button onClick={() => fileRef.current.click()} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Upload size={12} /> Open File
        </button>
        <input ref={fileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
        <button
          onClick={() => folderRef.current.click()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Loading…</>
            : <><FolderOpen size={12} /> Load Project</>
          }
        </button>
        <input ref={folderCallbackRef} type="file" multiple className="hidden" onChange={handleFolder} />
        <button onClick={() => setPasteOpen(true)} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Clipboard size={12} /> Paste HTML
        </button>
        <div className="h-4 w-px bg-neutral-700" />
        <button onClick={onUndo} disabled={!canUndo}
          className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (⌘Z)">↩</button>
        <button onClick={onRedo} disabled={!canRedo}
          className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (⌘⇧Z)">↪</button>
        <div className="flex-1" />
        <button
          onClick={onToggleLayers}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${layersOpen ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          <Layers size={12} /> Layers
        </button>
        <button onClick={onExport} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded flex items-center gap-1.5 transition-colors">
          <Download size={12} /> Export
        </button>
      </div>

      {pasteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-[560px] flex flex-col gap-3">
            <div className="text-sm font-semibold text-neutral-200">Paste HTML</div>
            <textarea
              autoFocus
              value={pasteValue}
              onChange={e => setPasteValue(e.target.value)}
              placeholder="<!DOCTYPE html>..."
              className="bg-neutral-800 border border-neutral-700 rounded p-2 text-xs font-mono text-neutral-300 h-48 resize-none outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPasteOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1.5">Cancel</button>
              <button onClick={handleApply} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded">Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
