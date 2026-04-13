import { useState } from 'react'
import TokenPicker from './TokenPicker'

const UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'auto']

export default function NumberInput({ label, value = '0px', onChange, tokens = [], min = 0, max, step = 1 }) {
  const [useToken, setUseToken] = useState(false)
  const str = String(value)
  const match = str.match(/^(-?\d*\.?\d+)(\D+)?$/)
  const num = match ? parseFloat(match[1]) : 0
  const unit = match ? (match[2]?.trim() ?? 'px') : 'px'
  const isAuto = str === 'auto'
  const resolvedMax = max ?? (unit === '%' || unit === 'em' || unit === 'rem' ? 10 : 400)

  function handleNum(e) { onChange(`${e.target.value}${unit}`) }
  function handleUnit(e) {
    if (e.target.value === 'auto') { onChange('auto'); return }
    onChange(`${num}${e.target.value}`)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>}
      <div className="flex gap-1 items-center">
        {useToken ? (
          <TokenPicker tokens={tokens} type="spacing" onChange={onChange} />
        ) : (
          <>
            <input type="range" min={min} max={resolvedMax} step={step} value={isAuto ? 0 : num}
              onChange={handleNum} className="flex-1 accent-blue-500 h-1" />
            <input type="number" value={isAuto ? '' : num} onChange={handleNum}
              className="w-12 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-1 py-0.5 text-center outline-none focus:border-blue-600" />
            <select value={isAuto ? 'auto' : unit} onChange={handleUnit}
              className="bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-400 px-1 py-0.5 outline-none">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </>
        )}
        {tokens.length > 0 && (
          <button onClick={() => setUseToken(t => !t)} title={useToken ? 'Raw value' : 'Use token'}
            className={`text-[10px] px-1 py-0.5 rounded border transition-colors ${useToken ? 'border-blue-700 text-blue-400 bg-blue-900/30' : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}>
            ⬡
          </button>
        )}
      </div>
    </div>
  )
}
