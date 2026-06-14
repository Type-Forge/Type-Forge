"use client"

import { motion } from "motion/react"

interface BattleTrackProps {
  label: string
  progress: number
  wpm?: number
  isPlayer: boolean
}

/**
 * Renders the sliding progress bar tracks for the race against the Enigma Machine.
 */
export default function BattleTrack({ label, progress, wpm, isPlayer }: BattleTrackProps) {
  return (
    <div className="w-full font-sans mb-6">
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <span
          className={`text-xs uppercase tracking-widest font-heading font-bold ${
            isPlayer ? "text-accent" : "text-text-secondary"
          }`}
        >
          {label}
        </span>
        {wpm !== undefined && (
          <span className="text-xs font-mono text-text-muted">{wpm} WPM</span>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full h-3.5 bg-surface border border-border rounded-full overflow-hidden relative p-[2px]">
        <motion.div
          className={`h-full rounded-full ${isPlayer ? "bg-accent" : "bg-text-muted"}`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Track Stats */}
      <div className="flex justify-between mt-1.5 px-0.5 text-[10px] font-mono text-text-muted leading-none">
        <span>Bletchley Sector Sync</span>
        <span>{Math.round(progress * 100)}% Decrypted</span>
      </div>
    </div>
  )
}
