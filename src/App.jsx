import { useRef, useState, useEffect, useCallback } from 'react'
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
  const [exportOpen, setExportOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)

  const { overrides, setProperty, removeProperty, undo, redo, canUndo, canRedo } = useStyleOverrides(iframeRef)
  const { tokens, loadFromHtml, upsertToken, deleteToken } = useTokens(iframeRef)

  // Undo/redo keyboard shortcut
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // Context menu messages from iframe
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
      />
      <div className="flex flex-1 overflow-hidden">
        {layersOpen && (
          <LayersPanel
            iframeRef={iframeRef}
            selectedSelector={selectedSelector}
            onSelect={setSelectedSelector}
            tokens={tokens}
            upsertToken={upsertToken}
            deleteToken={deleteToken}
          />
        )}
        <Preview ref={iframeRef} srcdoc={srcdoc} />
        <PropertiesPanel
          selector={selectedSelector}
          styles={mergedStyles}
          overrides={overrides}
          tokens={tokens}
          setProperty={setProperty}
        />
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
