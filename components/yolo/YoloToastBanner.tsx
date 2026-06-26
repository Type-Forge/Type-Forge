"use client"

import React from "react"
import { motion } from "motion/react"
import { playClickSound } from "@/lib/audio"
import { useSettingsStore } from "@/stores/settings-store"

export const STREAK_MILESTONES: Record<number, { title: string; desc: string; icon: string }> = {
  3: { title: "Warmup", desc: "3 perfect words in a row", icon: "" },
  5: { title: "Focused", desc: "5 perfect words in a row", icon: "" },
  10: { title: "Locked In", desc: "10 perfect words in a row", icon: "" },
  20: { title: "High Voltage", desc: "20 perfect words in a row", icon: "" },
  30: { title: "Machine Mode", desc: "30 perfect words in a row", icon: "" },
  50: { title: "Legendary", desc: "50 perfect words in a row", icon: "" },
  75: { title: "Absolute Legend", desc: "75 perfect words in a row", icon: "" },
  100: { title: "Legendary Run", desc: "100 perfect words in a row", icon: "" },
}

interface YoloToastBannerProps {
  toastId: string | number
  icon: string
  title: string
  description: string
  category?: string
  reward?: string
  onClose: (id: string | number) => void
}

export function YoloToastBanner({
  toastId,
  icon,
  title,
  description,
  reward,
  onClose,
}: YoloToastBannerProps) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)

  const initialProps = reducedMotion
    ? { opacity: 0 }
    : { y: -16, scale: 0.96, opacity: 0 }
  const animateProps = { y: 0, scale: 1, opacity: 1 }
  const transitionProps = reducedMotion
    ? { duration: 0.12, ease: "easeOut" as const }
    : { type: "spring" as const, damping: 20, stiffness: 300 }

  return (
    <motion.div
      initial={initialProps}
      animate={animateProps}
      exit={{ y: -10, opacity: 0 }}
      transition={transitionProps}
      className="w-[290px] max-w-full bg-surface/90 backdrop-blur-[20px] border border-border/80 rounded-[20px] p-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all duration-200 pointer-events-auto flex gap-3 items-center relative group font-sans"
      style={{ contentVisibility: "auto" }}
    >
      {/* Icon Container (44px, rounded-2xl) */}
      <div className="w-11 h-11 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center text-[20px] select-none shrink-0 shadow-sm">
        <span className="leading-none">{icon}</span>
      </div>

      {/* Text Content - Highly polished 2-line layout */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-3">
        {/* Title */}
        <h4 className="text-[14px] font-bold text-text-primary tracking-tight leading-snug">
          {title}
        </h4>

        {/* Description / Progress Metrics */}
        <p className="text-[12px] font-medium text-text-secondary mt-0.5 leading-normal whitespace-pre-line break-words">
          {description}
        </p>

        {/* Optional Reward - kept clean and small if present */}
        {reward && (
          <p className="text-[11px] font-semibold text-accent mt-0.5 flex items-center gap-1">
            {reward}
          </p>
        )}
      </div>

      {/* Floating Close Button */}
      <button
        type="button"
        onClick={() => {
          playClickSound("click")
          onClose(toastId)
        }}
        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-surface-secondary/80 hover:bg-surface-secondary border border-border/50 text-text-secondary hover:text-text-primary flex items-center justify-center transition-all duration-150 active:scale-[0.9] cursor-pointer shrink-0 text-[10px] leading-none opacity-0 group-hover:opacity-100"
      >
        ✕
      </button>
    </motion.div>
  )
}
