import { useState } from 'react'
import TokenPicker from './TokenPicker'

export default function ColorPicker({ label, value = '#000000', onChange, tokens = [] }) {
  const [useToken, setUseToken] = useState(false)
  const [alpha, setAlpha] = useState(100)
  const hexBase = value.startsWith('#') ? value.slice(0, 7) : '#000000'

  function handleColor(e) {
    const hex = e.target.value
    const alphaHex = alpha < 100 ? Math.round(alpha / 100 * 255).toString(16).padStart(2, '0') : ''
    onChange(`${hex}${alphaHex}`)
  }

  function handleAlpha(e) {
    const a = parseInt(e.target.value)
    setAlpha(a)
    const alphaHex = a < 100 ? Math.round(a / 100 * 255).toString(16).padStart(2, '0') : ''
    onChange(`${hexBase}${alphaHex}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>}
      {useToken ? (
        <div className="flex gap-1 items-center">
          <TokenPicker tokens={tokens} type="color" onChange={onChange} />
          <button onClick={() => setUseToken(false)}
            className="text-[10px] px-1 py-0.5 rounded border border-blue-700 text-blue-400 bg-blue-900/30">⬡</button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <input type="color" value={hexBase} onChange={handleColor}
              className="w-7 h-7 rounded border border-neutral-700 bg-neutral-800 cursor-pointer p-0.5" />
            <input type="text" value={hexBase} onChange={e => onChange(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
            {tokens.length > 0 && (
              <button onClick={() => setUseToken(true)} title="Use token"
                className="text-[10px] px-1 py-0.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300">⬡</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-neutral-500 w-8">Alpha</div>
            <input type="range" min={0} max={100} value={alpha} onChange={handleAlpha}
              className="flex-1 accent-blue-500 h-1" />
            <div className="text-[10px] text-neutral-400 w-8 text-right">{alpha}%</div>
          </div>
        </div>
      )}
    </div>
  )
}
