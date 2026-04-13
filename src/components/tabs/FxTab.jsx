import NumberInput from '../controls/NumberInput'
import SegmentGroup from '../controls/SegmentGroup'
import ColorPicker from '../controls/ColorPicker'

const EASING = ['linear','ease','ease-in','ease-out','ease-in-out'].map(v => ({ value: v, label: v }))
const VISIBILITY = [{ value:'visible', label:'Visible' }, { value:'hidden', label:'Hidden' }]
const TRANSFORM_FNS = ['rotate','scale','translateX','translateY','skewX']

function parseTransform(str = '') {
  const vals = {}
  for (const fn of TRANSFORM_FNS) {
    const m = str.match(new RegExp(`${fn}\\(([^)]+)\\)`))
    vals[fn] = m ? m[1] : (fn === 'scale' ? '1' : fn === 'rotate' ? '0deg' : '0px')
  }
  return vals
}

function buildTransform(vals) {
  return TRANSFORM_FNS.filter(fn => vals[fn]).map(fn => `${fn}(${vals[fn]})`).join(' ') || 'none'
}

export default function FxTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const colorTokens = tokens.filter(t => t.type === 'color')
  const tfVals = parseTransform(styles.transform)

  function setTf(fn, val) {
    set('transform', buildTransform({ ...tfVals, [fn]: val }))
  }

  const shadowParts = (styles.boxShadow ?? '0px 4px 8px 0px rgba(0,0,0,0.2)').split(' ')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Transform</div>
        <div className="flex flex-col gap-2">
          <NumberInput label="Rotate" value={tfVals.rotate} onChange={v => setTf('rotate', v)} tokens={[]} min={-360} max={360} />
          <NumberInput label="Scale" value={tfVals.scale} onChange={v => setTf('scale', v)} tokens={[]} min={0} max={3} step={0.05} />
          <NumberInput label="Translate X" value={tfVals.translateX} onChange={v => setTf('translateX', v)} tokens={[]} min={-400} max={400} />
          <NumberInput label="Translate Y" value={tfVals.translateY} onChange={v => setTf('translateY', v)} tokens={[]} min={-400} max={400} />
          <NumberInput label="Skew X" value={tfVals.skewX} onChange={v => setTf('skewX', v)} tokens={[]} min={-45} max={45} />
        </div>
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Box Shadow</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[['X',0],['Y',1],['Blur',2],['Spread',3]].map(([label, idx]) => (
            <NumberInput key={label} label={label} value={shadowParts[idx] ?? '0px'} min={-50} max={100}
              onChange={v => {
                const p = [...shadowParts]
                p[idx] = v
                set('boxShadow', p.join(' '))
              }} tokens={[]} />
          ))}
        </div>
        <ColorPicker label="Shadow Color" value="#000000"
          onChange={color => { const p = shadowParts.slice(0, 4); set('boxShadow', [...p, color].join(' ')) }}
          tokens={colorTokens} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Text Shadow</div>
        <input value={styles.textShadow ?? ''} onChange={e => set('textShadow', e.target.value)}
          placeholder="2px 2px 4px rgba(0,0,0,0.3)"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600 font-mono" />
      </div>

      <NumberInput label="Opacity" value={styles.opacity ?? '1'} onChange={v => set('opacity', v)} tokens={[]} min={0} max={1} step={0.01} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Transition</div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Duration" value={styles.transitionDuration ?? '300ms'} onChange={v => set('transitionDuration', v)} tokens={[]} min={0} max={3000} step={50} />
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Easing</div>
            <select value={styles.transitionTimingFunction ?? 'ease'} onChange={e => set('transitionTimingFunction', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600">
              {EASING.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Visibility</div>
        <SegmentGroup options={VISIBILITY} value={styles.visibility ?? 'visible'} onChange={v => set('visibility', v)} />
      </div>
    </div>
  )
}
