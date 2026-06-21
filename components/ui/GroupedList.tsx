"use client"

import React, { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface GroupedListProps {
  children: ReactNode
  className?: string
}

/**
 * Standard iOS Settings/Menus Grouped List wrapper.
 */
export function GroupedList({ children, className = "" }: GroupedListProps) {
  return (
    <div className={cn("divide-y divide-border/10 rounded-2xl bg-surface-secondary/40 border border-border/10 overflow-hidden", className)}>
      {children}
    </div>
  )
}

interface GroupedListItemProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  rightElement?: ReactNode
  onClick?: () => void
  href?: string
  destructive?: boolean
  selected?: boolean
  disabled?: boolean
  className?: string
}

/**
 * High-Fidelity list item following the iPad/iOS list specs.
 * Includes checkmarks, chevron support, and press states.
 */
export function GroupedListItem({
  title,
  subtitle,
  icon,
  rightElement,
  onClick,
  href,
  destructive = false,
  selected,
  disabled = false,
  className = "",
}: GroupedListItemProps) {
  const hasSelected = selected !== undefined

  const content = (
    <>
      <div className="flex items-center gap-3">
        {/* Selection Checkmark */}
        {hasSelected && (
          <span className={cn(
            "w-4 h-4 flex items-center justify-center text-[13px] leading-none transition-opacity",
            selected ? "text-accent font-bold opacity-100" : "text-transparent opacity-0 select-none"
          )}>
            ✓
          </span>
        )}

        {/* Leading Icon */}
        {icon && (
          <div className={cn("flex-shrink-0 flex items-center justify-center", selected ? "text-accent" : "text-text-secondary")}>
            {icon}
          </div>
        )}

        {/* Title and Subtitle */}
        <div className="flex flex-col">
          <span className={cn(
            "text-[15px] font-semibold tracking-tight leading-snug",
            destructive ? "text-danger" : selected ? "text-accent font-bold" : "text-text-primary"
          )}>
            {title}
          </span>
          {subtitle && (
            <span className="text-[13px] text-text-tertiary mt-0.5 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Trailing element (e.g. Chevron, value, etc.) */}
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </>
  )

  const itemStyles = cn(
    "w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-150 relative select-none focus:outline-none",
    disabled ? "opacity-40 pointer-events-none" : "active:scale-[0.99] active:bg-surface-hover/30 cursor-pointer",
    selected && "bg-accent/5",
    className
  )

  if (href) {
    return (
      <Link href={href} className={itemStyles}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={itemStyles} disabled={disabled}>
        {content}
      </button>
    )
  }

  return (
    <div className={itemStyles}>
      {content}
    </div>
  )
}

/**
 * Standard macOS/iOS disclosure chevron.
 */
export function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-3.5 w-3.5 text-text-tertiary/40", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
