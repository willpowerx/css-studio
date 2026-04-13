import NumberInput from '../controls/NumberInput'
import SegmentGroup from '../controls/SegmentGroup'
import ColorPicker from '../controls/ColorPicker'

const ALIGN_OPTS = [{ value:'left', label:'L' }, { value:'center', label:'C' }, { value:'right', label:'R' }, { value:'justify', label:'J' }]
const WEIGHT_VALS = ['100','200','300','400','500','600','700','800','900']
const DECORATION_OPTS = [{ value:'none', label:'None' }, { value:'underline', label:'U' }, { value:'line-through', label:'S' }, { value:'overline', label:'O' }]
const STYLE_OPTS = [{ value:'normal', label:'Normal' }, { value:'italic', label:'Italic' }]

export default function TypeTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const colorTokens = tokens.filter(t => t.type === 'color')
  const sizeTokens = tokens.filter(t => t.type === 'spacing')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Font Family</div>
        <input value={styles.fontFamily ?? ''} onChange={e => set('fontFamily', e.target.value)}
          placeholder="Inter, sans-serif"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Size" value={styles.fontSize ?? '16px'} onChange={v => set('fontSize', v)} tokens={sizeTokens} min={0} max={96} />
        <div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Weight</div>
          <select value={styles.fontWeight ?? '400'} onChange={e => set('fontWeight', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600">
            {WEIGHT_VALS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Line Height" value={styles.lineHeight ?? '1.5'} onChange={v => set('lineHeight', v)} tokens={[]} min={0.5} max={4} step={0.05} />
        <NumberInput label="Letter Spacing" value={styles.letterSpacing ?? '0em'} onChange={v => set('letterSpacing', v)} tokens={[]} min={-0.1} max={1} step={0.01} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Align</div>
        <SegmentGroup options={ALIGN_OPTS} value={styles.textAlign ?? 'left'} onChange={v => set('textAlign', v)} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Style</div>
        <SegmentGroup options={STYLE_OPTS} value={styles.fontStyle ?? 'normal'} onChange={v => set('fontStyle', v)} />
      </div>

      <ColorPicker label="Color" value={styles.color ?? '#000000'} onChange={v => set('color', v)} tokens={colorTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Decoration</div>
        <SegmentGroup options={DECORATION_OPTS} value={styles.textDecoration ?? 'none'} onChange={v => set('textDecoration', v)} />
      </div>
    </div>
  )
}
