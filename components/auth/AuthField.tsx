"use client"

// Reusable labelled input with inline validation error, styled to match the app.
export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  disabled,
  inputClassName,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
  inputClassName?: string
}) {
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
        className={`w-full rounded-[10px] bg-surface-secondary/50 border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-150 focus:border-accent/50 focus:bg-surface disabled:opacity-50 ${
          error ? "border-incorrect/60" : "border-border/15"
        } ${inputClassName || ""}`}
      />
      {error && <span className="text-[12px] text-incorrect font-medium">{error}</span>}
    </div>
  )
}
