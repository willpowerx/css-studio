import { useEffect, useState } from 'react'

function TreeNode({ node, depth, selectedSelector, onSelect }) {
  const [open, setOpen] = useState(depth < 3)
  if (!node.tagName) return null
  const tag = node.tagName.toLowerCase()
  if (['script','style','meta','link'].includes(tag)) return null
  const id = node.id && !node.id.startsWith('css-studio-') ? `#${node.id}` : ''
  const cls = [...(node.classList ?? [])].filter(c => !c.startsWith('css-studio-'))
  const classStr = cls.length ? `.${cls.join('.')}` : ''
  const label = `${tag}${id}${classStr}`
  const children = [...(node.children ?? [])].filter(c => !c.id?.startsWith('css-studio-'))
  const selector = node.id && !node.id.startsWith('css-studio-') ? `#${node.id}` : label
  const isSelected = selector === selectedSelector

  return (
    <div>
      <div onClick={() => onSelect(selector)}
        style={{ paddingLeft: `${8 + depth * 10}px` }}
        className={`flex items-center gap-1 py-0.5 pr-2 cursor-pointer text-[10px] font-mono rounded ${isSelected ? 'bg-blue-900/40 text-blue-300' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'}`}>
        <span onClick={e => { e.stopPropagation(); setOpen(o => !o) }} className="text-neutral-600 w-3 text-center">
          {children.length > 0 ? (open ? '▾' : '▸') : ' '}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {open && children.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} selectedSelector={selectedSelector} onSelect={onSelect} />
      ))}
    </div>
  )
}

function TokensTab({ tokens, upsertToken, deleteToken }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  return (
    <div className="p-2 flex flex-col gap-2 overflow-y-auto">
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">CSS Variables</div>
      {tokens.map(t => (
        <div key={t.name} className="flex items-center gap-1.5 group">
          {t.type === 'color' && <div className="w-3.5 h-3.5 rounded border border-neutral-700 flex-shrink-0" style={{ background: t.value }} />}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="text-[9px] text-blue-400 font-mono truncate">{t.name}</div>
            <input defaultValue={t.value} onBlur={e => upsertToken(t.name, e.target.value, t.type)}
              className="text-[9px] bg-transparent text-neutral-500 font-mono outline-none w-full" />
          </div>
          <button onClick={() => deleteToken(t.name)} className="text-neutral-700 hover:text-red-400 text-[9px] opacity-0 group-hover:opacity-100 flex-shrink-0">✕</button>
        </div>
      ))}
      <div className="border-t border-neutral-800 pt-2 flex flex-col gap-1 mt-1">
        <div className="text-[9px] text-neutral-600">Add token</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="--my-color"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="#2563eb"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
        <button onClick={() => { if (name && value) { upsertToken(name, value); setName(''); setValue('') } }}
          className="bg-blue-700 hover:bg-blue-600 text-white text-[9px] px-2 py-1 rounded">Add</button>
      </div>
    </div>
  )
}

export default function LayersPanel({ iframeRef, selectedSelector, onSelect, tokens, upsertToken, deleteToken }) {
  const [tab, setTab] = useState('layers')
  const [body, setBody] = useState(null)

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc?.body) setBody(doc.body)
  })

  return (
    <div className="w-44 bg-neutral-900 border-r border-neutral-800 flex-shrink-0 flex flex-col">
      <div className="flex border-b border-neutral-800 flex-shrink-0">
        <button onClick={() => setTab('layers')} className={`flex-1 text-[10px] py-2 ${tab === 'layers' ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>Layers</button>
        <button onClick={() => setTab('tokens')} className={`flex-1 text-[10px] py-2 ${tab === 'tokens' ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>Tokens</button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {tab === 'layers'
          ? body
            ? <TreeNode node={body} depth={0} selectedSelector={selectedSelector} onSelect={onSelect} />
            : <div className="text-[10px] text-neutral-600 p-3">Load HTML to see layers</div>
          : <TokensTab tokens={tokens} upsertToken={upsertToken} deleteToken={deleteToken} />
        }
      </div>
    </div>
  )
}
