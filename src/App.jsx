import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'
import PropertiesPanel from './components/PropertiesPanel'
import ContextMenu from './components/ContextMenu'
import LayersPanel from './components/LayersPanel'
import ExportModal from './components/ExportModal'
import { useStyleOverrides } from './hooks/useStyleOverrides'
import { useTokens } from './hooks/useTokens'
import { useIframeBridge } from './hooks/useIframeBridge'

export default function App() {
  const iframeRef = useRef(null)
  const [srcdoc, setSrcdoc] = useState('')
  const [originalHtml, setOriginalHtml] = useState('')
  const [selectedSelector, setSelectedSelector] = useState(null)
  const [currentStyles, setCurrentStyles] = useState({})
  const [layersOpen, setLayersOpen] = useState(false)
  const [propsPanelOpen, setPropsPanelOpen] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [focusMode, setFocusMode] = useState(false)
  const preFocusState = useRef(null)

  const { overrides, setProperty, undo, redo, canUndo, canRedo } = useStyleOverrides(iframeRef)
  const { tokens, loadFromHtml, upsertToken, deleteToken } = useTokens(iframeRef)

  // latestRef keeps current panel state readable from stable callbacks without stale closures
  const latestRef = useRef({})
  latestRef.current = { focusMode, layersOpen, propsPanelOpen }

  const toggleFocusMode = useCallback(() => {
    const { focusMode, layersOpen, propsPanelOpen } = latestRef.current
    if (!focusMode) {
      preFocusState.current = { layersOpen, propsPanelOpen }
      setLayersOpen(false)
      setPropsPanelOpen(false)
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.__cssStudioEnabled = false
      }
      setFocusMode(true)
    } else {
      if (preFocusState.current) {
        setLayersOpen(preFocusState.current.layersOpen)
        setPropsPanelOpen(preFocusState.current.propsPanelOpen)
        preFocusState.current = null
      }
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.__cssStudioEnabled = true
      }
      setFocusMode(false)
    }
  }, [])

  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      if ((e.key === 'f' || e.key === 'F') && !mod) {
        const tag = document.activeElement?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault()
          toggleFocusMode()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, toggleFocusMode])

  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === 'css-studio-contextmenu') {
        setSelectedSelector(e.data.selector)
        setContextMenu({ x: e.data.x, y: e.data.y, selector: e.data.selector })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const handleSelect = useCallback((selector, styles) => {
    setSelectedSelector(selector)
    setCurrentStyles(styles)
  }, [])
  useIframeBridge(iframeRef, handleSelect)

  const handleLoadHtml = useCallback((html) => {
    setOriginalHtml(html)
    setSrcdoc(html)
    loadFromHtml(html)
    setSelectedSelector(null)
    setCurrentStyles({})
  }, [loadFromHtml])

  const mergedStyles = { ...currentStyles, ...(overrides.get(selectedSelector) ?? {}) }

  function handleContextAction(action) {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !contextMenu) return
    const el = doc.querySelector(contextMenu.selector)
    if (!el) return
    switch (action) {
      case 'editText':
        el.contentEditable = 'true'; el.focus(); break
      case 'duplicate':
        el.insertAdjacentElement('afterend', el.cloneNode(true)); break
      case 'moveUp':
        if (el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); break
      case 'moveDown':
        if (el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); break
      case 'addSibling': {
        const newEl = doc.createElement('div')
        newEl.textContent = 'New element'
        el.insertAdjacentElement('afterend', newEl); break
      }
      case 'delete':
        el.remove(); setSelectedSelector(null); break
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        onLoadHtml={handleLoadHtml}
        layersOpen={layersOpen}
        onToggleLayers={() => setLayersOpen(o => !o)}
        onExport={() => setExportOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        focusMode={focusMode}
        onToggleFocusMode={toggleFocusMode}
      />
      <div className="flex flex-1 overflow-hidden">
        {layersOpen ? (
          <LayersPanel
            iframeRef={iframeRef}
            selectedSelector={selectedSelector}
            onSelect={setSelectedSelector}
            tokens={tokens}
            upsertToken={upsertToken}
            deleteToken={deleteToken}
            onCollapse={() => setLayersOpen(false)}
          />
        ) : (
          <div className="w-4 bg-neutral-900 border-r border-neutral-800 flex-shrink-0 flex flex-col items-center pt-2">
            <button onClick={() => setLayersOpen(true)} title="Show Layers" className="text-neutral-700 hover:text-neutral-400 transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>
        )}
        <Preview ref={iframeRef} srcdoc={srcdoc} />
        {propsPanelOpen ? (
          <PropertiesPanel
            selector={selectedSelector}
            styles={mergedStyles}
            overrides={overrides}
            tokens={tokens}
            setProperty={setProperty}
            onCollapse={() => setPropsPanelOpen(false)}
          />
        ) : (
          <div className="w-4 bg-neutral-900 border-l border-neutral-800 flex-shrink-0 flex flex-col items-center pt-2">
            <button onClick={() => setPropsPanelOpen(true)} title="Show Properties" className="text-neutral-700 hover:text-neutral-400 transition-colors">
              <ChevronLeft size={12} />
            </button>
          </div>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          selector={contextMenu.selector}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}
      {exportOpen && (
        <ExportModal
          overrides={overrides}
          originalHtml={originalHtml}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}
