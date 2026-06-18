"use client"

import { motion } from "motion/react"

interface BattleTrackProps {
  label: string
  progress: number
  wpm?: number
  isPlayer: boolean
}

/**
 * Modern progress track showing competitor progress.
 * Uses a thin line indicator height of h-1 and floats labels cleanly.
 */
export default function BattleTrack({ label, progress, wpm, isPlayer }: BattleTrackProps) {
  return (
    <div className="w-full font-sans mb-2 select-none">
      <div className="flex justify-between items-center mb-2 px-0.5">
        <span
          className={`text-[13px] font-semibold ${
            isPlayer ? "text-accent" : "text-text-secondary"
          }`}
        >
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </span>
        {wpm !== undefined && (
          <span className="text-[13px] font-sans font-medium text-text-muted tabular-nums">{wpm} WPM</span>
        )}
      </div>

      {/* Progress Track Line - 4px thickness */}
      <div className="h-1 w-full rounded-full bg-border relative">
        <motion.div
          className={`h-full rounded-full ${isPlayer ? "bg-accent" : "bg-text-secondary"}`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={
            isPlayer
              ? { type: "spring", stiffness: 100, damping: 20 }
              : { type: "tween", ease: "linear", duration: 0.1 }
          }
        />
        {/* Sliding cursor indicator dot (neutral shade for AI) */}
        <motion.div
          className={`absolute top-1/2 w-2.5 h-2.5 rounded-full border border-surface shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${
            isPlayer ? "bg-accent" : "bg-text-tertiary"
          }`}
          initial={{ left: "0%" }}
          animate={{ left: `${progress * 100}%` }}
          transition={
            isPlayer
              ? { type: "spring", stiffness: 100, damping: 20 }
              : { type: "tween", ease: "linear", duration: 0.1 }
          }
          style={{ transform: "translate(-50%, -50%)" }}
        />
      </div>

      {/* Track Stats */}
      <div className="flex justify-end mt-1 px-0.5 text-[13px] font-sans font-medium text-text-muted tabular-nums">
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}
