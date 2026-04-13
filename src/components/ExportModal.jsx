import { useRef } from 'react'
import { X, Copy, Download } from 'lucide-react'
import { formatCssDiff, injectStyles, downloadHtml } from '../utils/htmlExport'
import { synthesizeCss } from '../utils/cssParser'

export default function ExportModal({ overrides, originalHtml, onClose }) {
  const diff = formatCssDiff(overrides)
  const diffRef = useRef()

  function handleCopy() {
    navigator.clipboard.writeText(diff)
    diffRef.current.style.borderColor = '#22c55e'
    setTimeout(() => { if (diffRef.current) diffRef.current.style.borderColor = '' }, 1200)
  }

  function handleDownload() {
    downloadHtml(injectStyles(originalHtml, synthesizeCss(overrides)))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-[540px] max-h-[80vh] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-neutral-200">Export</div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors"><X size={14} /></button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">CSS Changes Only</div>
            <button onClick={handleCopy} className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors">
              <Copy size={10} /> Copy
            </button>
          </div>
          <pre ref={diffRef} className="bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-green-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto transition-colors">
            {diff || '/* no changes yet */'}
          </pre>
        </div>

        <div className="flex items-center justify-between border border-neutral-800 rounded-lg p-3">
          <div>
            <div className="text-xs text-neutral-300 font-medium">Full HTML File</div>
            <div className="text-[10px] text-neutral-600 mt-0.5">Original markup + injected &lt;style&gt; in &lt;head&gt;</div>
          </div>
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded transition-colors">
            <Download size={11} /> Download
          </button>
        </div>
      </div>
    </div>
  )
}
