"use client"

interface InputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
}

export default function Input({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  disabled,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-[10px] bg-surface-secondary/50 border border-border/15 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none transition-all duration-150 focus:border-accent/50 focus:bg-surface disabled:opacity-50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]"
      />
      {error && <span className="text-[12px] text-incorrect font-medium">{error}</span>}
    </div>
  )
}
