"use client"

export interface SubOption<T> {
  value: T
  label: string
  tooltip?: string
}

interface SubOptionSelectorProps<T> {
  options: SubOption<T>[]
  selected: T
  onSelect: (value: T) => void
}

/**
 * Generic horizontal option selector with Apple HIG styling and glassmorphic tooltips.
 * Eliminates duplication across Words, Timed, and Battle selectors.
 */
export default function SubOptionSelector<T extends string | number>({
  options,
  selected,
  onSelect,
}: SubOptionSelectorProps<T>) {
  return (
    <div className="flex items-center justify-center gap-6 py-2 select-none font-sans">
      {options.map((opt) => (
        <div className="relative group" key={String(opt.value)}>
          <button
            onClick={() => onSelect(opt.value)}
            className={`text-[14px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer select-none focus:outline-none ${
              selected === opt.value
                ? "text-accent font-bold"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
          
          {opt.tooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform scale-95 group-hover:scale-100 bg-surface/95 border border-border/15 backdrop-blur-xl p-2.5 rounded-xl text-[11px] leading-normal text-text-secondary text-center shadow-lg">
              {opt.tooltip}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
