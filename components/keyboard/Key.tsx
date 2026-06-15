"use client"

import { cn } from "@/lib/utils"

interface KeyProps {
  label: string
  subLabel?: string
  status: "default" | "active" | "incorrect" | "dimmed"
  widthClass?: string
  heightClass?: string
  isMacLayout?: boolean
  onClick?: () => void
}

/**
 * Key atom component representing a key cap inside the KeyboardBody.
 * Adheres strictly to the Apple HIG styles and theme CSS variables.
 * NO grey color differentiation — all default keys use the same surface color.
 * Only ESC gets solid accent blue.
 */
export default function Key({
  label,
  subLabel,
  status,
  widthClass = "flex-1",
  heightClass = "h-9 sm:h-10",
  isMacLayout = true,
  onClick,
}: KeyProps) {
  const isSpecialKey = label.length > 2 || label === "fn" || label === "ctrl" || label === "alt" || label === "win" || label === "◀" || label === "▶" || label === "▲" || label === "▼"

  // Uniform color scheme: all default keys use surface color, only ESC gets accent blue
  const statusClasses = {
    default: label === "esc"
      ? "bg-[var(--color-accent)] border-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),_0_2.5px_4px_rgba(10,132,255,0.35)] border-b-[2.5px] border-b-[#005ecb]"
      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_2px_3px_rgba(0,0,0,0.2)] border-b-[2.5px] border-b-black/10 dark:border-b-black/50 hover:bg-[var(--color-surface-hover)]",
    active: "bg-[var(--color-accent)] border-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),_0_2.5px_4px_rgba(10,132,255,0.35)] border-b-[2.5px] border-b-[#005ecb]",
    incorrect: "bg-danger/20 border-danger/45 text-danger shadow-[0_2px_3px_rgba(255,69,58,0.15)] border-b-[2.5px] border-b-danger/55",
    dimmed: "opacity-40 bg-surface-hover/30 text-[var(--color-text-secondary)] border-[var(--color-border)]/50 border-b-[1.5px]",
  }

  return (
    <button
      onClick={onClick}
      disabled={status === "dimmed" && !onClick}
      className={cn(
        "min-w-0 rounded-[6px] border flex flex-col items-center justify-between p-1 select-none cursor-pointer text-[12px] font-sans font-medium transition-all duration-100 ease-in-out active:scale-[0.95]",
        widthClass,
        heightClass,
        statusClasses[status]
      )}
    >
      {subLabel ? (
        <div className="flex flex-col items-start justify-between w-full h-full text-[9px] sm:text-[10px] leading-tight px-0.5">
          <span className={cn("font-medium", status === "active" ? "text-white" : "text-[var(--color-text-secondary)]")}>{subLabel}</span>
          <span className="self-end font-semibold">{label}</span>
        </div>
      ) : isSpecialKey ? (
        <div className="flex items-center justify-center w-full h-full text-[9px] sm:text-[10px] lowercase font-medium tracking-tight px-0.5 text-center overflow-hidden whitespace-nowrap">
          {label}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-xs sm:text-sm font-bold uppercase">
          {label}
        </div>
      )}
    </button>
  )
}
