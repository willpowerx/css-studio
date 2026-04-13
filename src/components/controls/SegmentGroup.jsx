export default function SegmentGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-0.5 bg-neutral-800 rounded p-0.5">
      {options.map(opt => {
        const val = opt.value ?? opt
        const label = opt.icon ?? opt.label ?? val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            title={opt.label ?? val}
            className={`flex-1 text-center text-[10px] py-1 rounded transition-colors ${val === value ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
