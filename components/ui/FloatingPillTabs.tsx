"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ReactNode } from "react"

export interface TabOption {
  value: string
  label: string
  href?: string
  icon?: ReactNode
}

interface FloatingPillTabsProps {
  options: TabOption[]
  activeValue: string
  onChange?: (value: string) => void
  layoutId: string
  leftElement?: ReactNode
  rightElement?: ReactNode
  className?: string
}

/**
 * iPadOS Edit Menu & Segmented Control style capsule tabs.
 * Supports sliding active backgrounds, custom dividers, leading/trailing icons.
 */
export default function FloatingPillTabs({
  options,
  activeValue,
  onChange,
  layoutId,
  leftElement,
  rightElement,
  className = "",
}: FloatingPillTabsProps) {
  return (
    <div className={`bg-surface-secondary/40 border border-border/10 p-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-sm select-none ${className}`}>
      {leftElement && (
        <div className="flex items-center gap-1 mr-0.5">
          {leftElement}
          <div className="w-[1px] h-3 bg-border-strong/15 ml-0.5" />
        </div>
      )}

      {options.map((option) => {
        const isActive = option.value === activeValue
        const content = (
          <span className="relative z-10 flex items-center gap-1.5 leading-none">
            {option.icon}
            {option.label}
          </span>
        )

        const baseStyles = `px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] select-none cursor-pointer relative flex items-center justify-center focus:outline-none ${
          isActive
            ? "text-accent font-bold"
            : "text-text-secondary hover:text-text-primary"
        }`

        if (option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              className={baseStyles}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-surface rounded-full shadow-sm border border-border/5"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{ zIndex: 0 }}
                />
              )}
              {content}
            </Link>
          )
        }

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            className={baseStyles}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-surface rounded-full shadow-sm border border-border/5"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            {content}
          </button>
        )
      })}

      {rightElement && (
        <div className="flex items-center gap-1 ml-0.5">
          <div className="w-[1px] h-3 bg-border-strong/15 mr-0.5" />
          {rightElement}
        </div>
      )}
    </div>
  )
}
