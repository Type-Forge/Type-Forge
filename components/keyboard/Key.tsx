"use client"

import { cn } from "@/lib/utils"

interface KeyProps {
  label: string
  subLabel?: string
  status: "default" | "active" | "incorrect" | "dimmed"
  isFocusKey?: boolean
  widthClass?: string
  heightClass?: string
  isMacLayout?: boolean
  onClick?: () => void
  code?: string
}

/**
 * Key atom component representing a flat Magic Keyboard style key cap.
 * Adheres strictly to the Apple HIG styles and supports a top-right selection dot indicator.
 */
export default function Key({
  label,
  subLabel,
  status,
  isFocusKey = false,
  widthClass = "flex-1",
  heightClass = "h-9 sm:h-10",
  isMacLayout = true,
  onClick,
  code,
}: KeyProps) {
  const isLetter = label.length === 1 && /^[a-zA-Z]$/.test(label)
  
  // Identify F-row keys
  const isFKey = label.toUpperCase() === "ESC" || /^F\d+$/.test(label)

  // Wide special keys on the left side
  const isLeftSpecial = code === "Tab" || code === "CapsLock" || code === "ShiftLeft"

  // Wide special keys on the right side
  const isRightSpecial = code === "Backspace" || code === "Enter" || code === "ShiftRight"

  // Other control keys that should be centered lowercase
  const isControlKey = 
    label === "fn" || 
    label === "control" || 
    label === "option" || 
    label === "command" || 
    label === "ctrl" || 
    label === "win" || 
    label === "alt" ||
    label === " "

  // Arrow keys
  const isArrowKey = label === "◀" || label === "▶" || label === "▲" || label === "▼"

  // Active / Incorrect states override normal text colors
  const isActiveOrWrong = status === "active" || status === "incorrect"

  // Flat elegant chiclet keycap styles (replaces thick bevel 3D style)
  const statusClasses = {
    default: "bg-surface border-border/15 text-text-primary hover:bg-surface-hover active:bg-surface-hover/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
    active: "bg-accent border-transparent text-white shadow-[0_0_10px_rgba(10,132,255,0.25)]",
    incorrect: "bg-danger border-transparent text-white shadow-[0_0_10px_rgba(255,69,58,0.25)]",
    dimmed: "opacity-30 bg-surface-secondary text-text-muted border-border/5 pointer-events-none",
  }

  // Helper to render keycap content based on categorizations
  const renderContent = () => {
    // 1. Keys with sublabels (numbers and symbol keys, e.g. `! 1`, `~ `)
    if (subLabel) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-[11px] leading-[1.3] font-bold">
          <span className={cn(isActiveOrWrong ? "text-white" : "text-text-secondary")}>
            {subLabel}
          </span>
          <span className={cn(isActiveOrWrong ? "text-white" : "text-text-primary")}>
            {label}
          </span>
        </div>
      )
    }

    // 2. Wide special keys on the left (e.g. Tab, CapsLock, Left Shift)
    if (isLeftSpecial) {
      return (
        <div className="flex items-center justify-start w-full h-full text-[9px] sm:text-[10px] lowercase font-medium px-2 text-text-secondary select-none">
          <span className={cn(isActiveOrWrong && "text-white")}>{label}</span>
        </div>
      )
    }

    // 3. Wide special keys on the right (e.g. Backspace, Enter, Right Shift)
    if (isRightSpecial) {
      return (
        <div className="flex items-center justify-end w-full h-full text-[9px] sm:text-[10px] lowercase font-medium px-2 text-text-secondary select-none">
          <span className={cn(isActiveOrWrong && "text-white")}>{label}</span>
        </div>
      )
    }

    // 4. Center-aligned control/modifier keys (e.g. fn, option, command)
    if (isControlKey) {
      return (
        <div className="flex items-center justify-center w-full h-full text-[9px] sm:text-[10px] lowercase font-medium text-text-secondary select-none text-center">
          <span className={cn(isActiveOrWrong && "text-white")}>{label}</span>
        </div>
      )
    }

    // 5. Centered F-row keys
    if (isFKey) {
      return (
        <div className="flex items-center justify-center w-full h-full text-[9px] sm:text-[10px] uppercase font-bold text-text-secondary select-none text-center">
          <span className={cn(isActiveOrWrong && "text-white")}>{label}</span>
        </div>
      )
    }

    // 6. Arrow keys
    if (isArrowKey) {
      return (
        <div className="flex items-center justify-center w-full h-full text-xs font-bold select-none text-center">
          <span className={cn(isActiveOrWrong ? "text-white" : "text-text-primary")}>{label}</span>
        </div>
      )
    }

    // 7. Standard Letter keys
    return (
      <div className="flex items-center justify-center w-full h-full text-xs sm:text-sm font-bold uppercase select-none text-center">
        <span className={cn(
          isActiveOrWrong 
            ? "text-white" 
            : isFocusKey && status === "default" 
              ? "text-accent font-bold" 
              : "text-text-primary"
        )}>{label}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      type="button"
      disabled={status === "dimmed"}
      className={cn(
        "min-w-0 rounded-[6px] border flex flex-col items-center justify-between select-none cursor-pointer font-sans transition-all duration-150 ease-in-out active:scale-[0.97] relative focus:outline-none",
        widthClass,
        heightClass,
        isFocusKey && status === "default"
          ? "bg-accent/10 dark:bg-accent/15 border-accent/25 dark:border-accent/30 shadow-[0_1px_2px_rgba(10,132,255,0.06)]"
          : statusClasses[status]
      )}
    >
      {/* Selection focus dot (white on active/incorrect key backgrounds, black in light mode, white in dark mode) */}
      {isFocusKey && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 shadow-[0_0_2px_rgba(0,0,0,0.15)] animate-fade-in",
            isActiveOrWrong ? "bg-white" : "bg-accent"
          )}
        />
      )}

      {renderContent()}
    </button>
  )
}
