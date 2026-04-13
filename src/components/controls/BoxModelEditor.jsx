import NumberInput from './NumberInput'

const SIDES = ['Top', 'Right', 'Bottom', 'Left']

export default function BoxModelEditor({ label, propPrefix, values = {}, onChange, tokens = [] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {SIDES.map(side => {
          const prop = `${propPrefix}${side}`
          return (
            <NumberInput key={side} label={side} value={values[prop] ?? '0px'}
              onChange={val => onChange(prop, val)} tokens={tokens} />
          )
        })}
      </div>
    </div>
  )
}
