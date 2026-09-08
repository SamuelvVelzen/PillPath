export function DoseTimeField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <label htmlFor={id} className="mt-3 block">
      <span className="text-sm font-semibold text-mute">{label}</span>
      <input
        id={id}
        type="time"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2 disabled:opacity-60"
      />
    </label>
  )
}
