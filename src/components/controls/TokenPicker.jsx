export default function TokenPicker({ tokens, type, onChange }) {
  const filtered = tokens.filter(t => type === 'any' || t.type === type)
  return (
    <select
      defaultValue=""
      onChange={e => onChange(e.target.value ? `var(${e.target.value})` : '')}
      className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600"
    >
      <option value="">— select token —</option>
      {filtered.map(t => (
        <option key={t.name} value={t.name}>{t.name} ({t.value})</option>
      ))}
    </select>
  )
}
