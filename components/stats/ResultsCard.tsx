"use client"

import { motion } from "motion/react"
import type { SessionResult } from "@/types"

interface ResultsCardProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

/**
 * ResultsCard reveals WPM, accuracy, durations, and key metrics.
 * Uses staggered framer-motion entry transitions for a premium presentation.
 */
export default function ResultsCard({ result, onRestart, onNewSession }: ResultsCardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  } as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-xl mx-auto p-8 bg-surface border border-border rounded-xl shadow-lg mt-8"
    >
      {/* Hero Decryption WPM */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-xs uppercase tracking-widest text-text-muted font-heading font-semibold mb-2">
          Decryption Complete
        </h2>
        <div className="flex justify-center items-baseline gap-2">
          <span className="text-6xl font-heading font-bold text-accent leading-none">
            {result.wpm}
          </span>
          <span className="text-xl text-text-secondary font-mono">WPM</span>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-6 mb-8 border-t border-b border-border/50 py-6"
      >
        <div className="text-center">
          <span className="block text-xs uppercase tracking-wider text-text-muted font-heading font-semibold mb-1">
            Accuracy
          </span>
          <span className="text-2xl font-mono font-bold text-text-primary">
            {result.accuracy}%
          </span>
        </div>
        <div className="text-center">
          <span className="block text-xs uppercase tracking-wider text-text-muted font-heading font-semibold mb-1">
            Time Taken
          </span>
          <span className="text-2xl font-mono font-bold text-text-primary">
            {result.duration.toFixed(1)}s
          </span>
        </div>
        <div className="text-center">
          <span className="block text-xs uppercase tracking-wider text-text-muted font-heading font-semibold mb-1">
            Keystrokes
          </span>
          <span className="text-lg font-mono text-text-primary">
            <span className="text-correct font-bold">{result.correctKeystrokes}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-text-secondary">{result.totalKeystrokes}</span>
          </span>
        </div>
        <div className="text-center">
          <span className="block text-xs uppercase tracking-wider text-text-muted font-heading font-semibold mb-1">
            Words Decoded
          </span>
          <span className="text-2xl font-mono font-bold text-text-primary">
            {result.wordsCompleted}
          </span>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex gap-4 justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-2.5 rounded-lg bg-accent text-bg hover:opacity-90 transition-all font-heading font-bold text-sm shadow-md cursor-pointer"
        >
          Try Again
        </button>
        <button
          onClick={onNewSession}
          className="px-6 py-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all font-heading font-bold text-sm cursor-pointer"
        >
          New Session
        </button>
      </motion.div>
    </motion.div>
  )
}
