"use client"

import { motion } from "motion/react"

interface BattleTrackProps {
  label: string
  progress: number
  wpm?: number
  isPlayer: boolean
}

/**
 * Modern progress track showing competitor lanes.
 * Uses clean thin bars instead of double borders or chunky sliders.
 */
export default function BattleTrack({ label, progress, wpm, isPlayer }: BattleTrackProps) {
  return (
    <div className="w-full font-sans mb-6 select-none">
      <div className="flex justify-between items-center mb-2 px-0.5">
        <span
          className={`text-[10px] uppercase tracking-widest font-heading font-bold ${
            isPlayer ? "text-accent" : "text-text-secondary"
          }`}
        >
          {label}
        </span>
        {wpm !== undefined && (
          <span className="text-[10px] font-mono text-text-muted">{wpm} WPM</span>
        )}
      </div>

      {/* Progress Track Line */}
      <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full ${isPlayer ? "bg-accent" : "bg-text-muted"}`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Track Stats */}
      <div className="flex justify-between mt-2 px-0.5 text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted leading-none">
        <span>Grid Sector</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}
