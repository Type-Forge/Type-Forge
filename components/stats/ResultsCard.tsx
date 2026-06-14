"use client"

import { motion } from "motion/react"
import type { SessionResult } from "@/types"

interface ResultsCardProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

/**
 * ResultsCard displays final speed metrics and decryption review data.
 * Adheres to Emil's philosophy of tactile micro-scales and quiet borders.
 */
export default function ResultsCard({ result, onRestart, onNewSession }: ResultsCardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  } as const

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  } as const

  const total = result.totalKeystrokes
  const correct = result.correctKeystrokes

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm select-none"
    >
      {/* Hero stat */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <span className="text-5xl font-heading font-bold tabular-nums text-text-primary leading-none">
          {result.wpm}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.15em] text-text-muted mt-2">
          words per minute
        </span>
      </motion.div>

      {/* Secondary stats — horizontal row */}
      <motion.div
        variants={itemVariants}
        className="flex justify-center gap-8 py-4 border-t border-border"
      >
        <div className="flex flex-col items-center">
          <span className="text-sm font-mono tabular-nums text-text-primary font-semibold">
            {result.accuracy}%
          </span>
          <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted mt-1">
            accuracy
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-mono tabular-nums text-text-primary font-semibold">
            {result.duration.toFixed(1)}s
          </span>
          <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted mt-1">
            time
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-mono tabular-nums text-text-primary font-semibold">
            {correct}/{total}
          </span>
          <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted mt-1">
            correct
          </span>
        </div>
      </motion.div>

      {/* Action buttons with press visual responses */}
      <motion.div variants={itemVariants} className="flex gap-3 mt-6">
        <button
          onClick={onRestart}
          className="flex-1 h-9 rounded-lg bg-accent text-bg text-sm font-medium hover:opacity-95
                     transition-transform duration-150 active:scale-[0.97] cursor-pointer"
        >
          try again
        </button>
        <button
          onClick={onNewSession}
          className="flex-1 h-9 rounded-lg border border-border text-sm text-text-secondary bg-transparent
                     hover:bg-surface-hover hover:text-text-primary transition-[transform,colors,background-color] duration-150 active:scale-[0.97] cursor-pointer"
        >
          new session
        </button>
      </motion.div>
    </motion.div>
  )
}
