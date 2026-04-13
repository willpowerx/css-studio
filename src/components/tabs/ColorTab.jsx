import { useState } from 'react'
import ColorPicker from '../controls/ColorPicker'
import SegmentGroup from '../controls/SegmentGroup'
import NumberInput from '../controls/NumberInput'

const BORDER_STYLES = ['none','solid','dashed','dotted','double'].map(v => ({ value: v, label: v }))
const BG_MODES = [{ value:'color', label:'Color' }, { value:'gradient', label:'Gradient' }]

function GradientEditor({ styles, set, tokens }) {
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState([{ color: '#667eea' }, { color: '#764ba2' }])
  const colorTokens = tokens.filter(t => t.type === 'color')

  function rebuild(a, s) {
    set('backgroundImage', `linear-gradient(${a}deg, ${s.map((st, i) => `${st.color} ${i === 0 ? 0 : 100}%`).join(', ')})`)
    set('backgroundColor', 'transparent')
  }

  return (
    <div className="flex flex-col gap-2">
      <NumberInput label="Angle" value={`${angle}deg`} onChange={v => { const a = parseInt(v)||0; setAngle(a); rebuild(a, stops) }} tokens={[]} min={0} max={360} />
      {stops.map((stop, i) => (
        <ColorPicker key={i} label={`Stop ${i + 1}`} value={stop.color}
          onChange={c => { const s = stops.map((x, j) => j === i ? { color: c } : x); setStops(s); rebuild(angle, s) }}
          tokens={colorTokens} />
      ))}
    </div>
  )
}

export default function ColorTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const [bgMode, setBgMode] = useState('color')
  const colorTokens = tokens.filter(t => t.type === 'color')
  const spacingTokens = tokens.filter(t => t.type === 'spacing')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Background</div>
        <SegmentGroup options={BG_MODES} value={bgMode} onChange={setBgMode} />
      </div>

      {bgMode === 'color'
        ? <ColorPicker value={styles.backgroundColor ?? '#ffffff'} onChange={v => set('backgroundColor', v)} tokens={colorTokens} />
        : <GradientEditor styles={styles} set={set} tokens={tokens} />
      }

      <ColorPicker label="Text Color" value={styles.color ?? '#000000'} onChange={v => set('color', v)} tokens={colorTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Border</div>
        <div className="flex flex-col gap-2">
          <SegmentGroup options={BORDER_STYLES} value={styles.borderStyle ?? 'none'} onChange={v => set('borderStyle', v)} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Width" value={styles.borderWidth ?? '1px'} onChange={v => set('borderWidth', v)} tokens={[]} min={0} max={20} />
            <NumberInput label="Radius" value={styles.borderRadius ?? '0px'} onChange={v => set('borderRadius', v)} tokens={spacingTokens} min={0} max={100} />
          </div>
          <ColorPicker label="Border Color" value={styles.borderColor ?? '#000000'} onChange={v => set('borderColor', v)} tokens={colorTokens} />
        </div>
      </div>
    </div>
  )
}
