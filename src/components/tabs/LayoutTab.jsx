import SegmentGroup from '../controls/SegmentGroup'
import NumberInput from '../controls/NumberInput'
import BoxModelEditor from '../controls/BoxModelEditor'

const DISPLAY_OPTS = ['block','flex','grid','inline','inline-flex','none'].map(v => ({ value: v, label: v }))
const FLEX_DIR = [{ value:'row', label:'→' }, { value:'column', label:'↓' }, { value:'row-reverse', label:'←' }, { value:'column-reverse', label:'↑' }]
const ALIGN_OPTS = ['flex-start','center','flex-end','stretch','baseline'].map(v => ({ value: v, label: v.replace('flex-','') }))
const JUSTIFY_OPTS = ['flex-start','center','flex-end','space-between','space-around','space-evenly'].map(v => ({ value: v, label: v.replace('flex-','').replace('space-','sp-') }))

export default function LayoutTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const spacingTokens = tokens.filter(t => t.type === 'spacing')
  const isFlex = (styles.display ?? '').includes('flex')
  const isGrid = styles.display === 'grid'

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Display</div>
        <SegmentGroup options={DISPLAY_OPTS} value={styles.display ?? 'block'} onChange={v => set('display', v)} />
      </div>

      {isFlex && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Direction</div>
            <SegmentGroup options={FLEX_DIR} value={styles.flexDirection ?? 'row'} onChange={v => set('flexDirection', v)} />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Align Items</div>
            <SegmentGroup options={ALIGN_OPTS} value={styles.alignItems ?? 'stretch'} onChange={v => set('alignItems', v)} />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Justify Content</div>
            <SegmentGroup options={JUSTIFY_OPTS} value={styles.justifyContent ?? 'flex-start'} onChange={v => set('justifyContent', v)} />
          </div>
          <NumberInput label="Gap" value={styles.gap ?? '0px'} onChange={v => set('gap', v)} tokens={spacingTokens} max={200} />
        </div>
      )}

      {isGrid && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Template Columns</div>
            <input value={styles.gridTemplateColumns ?? 'repeat(3, 1fr)'} onChange={e => set('gridTemplateColumns', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
          </div>
          <NumberInput label="Gap" value={styles.gap ?? '0px'} onChange={v => set('gap', v)} tokens={spacingTokens} max={200} />
        </div>
      )}

      <BoxModelEditor label="Padding" propPrefix="padding" values={styles}
        onChange={(prop, val) => set(prop, val)} tokens={spacingTokens} />
      <BoxModelEditor label="Margin" propPrefix="margin" values={styles}
        onChange={(prop, val) => set(prop, val)} tokens={spacingTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Sizing</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[['W','width'],['H','height'],['min-W','minWidth'],['max-W','maxWidth'],['min-H','minHeight'],['max-H','maxHeight']].map(([label, prop]) => (
            <NumberInput key={prop} label={label} value={styles[prop] ?? ''} onChange={v => set(prop, v)} tokens={spacingTokens} max={2000} />
          ))}
        </div>
      </div>
    </div>
  )
}
