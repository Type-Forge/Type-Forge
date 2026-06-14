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
 * Styled following the craft aesthetic (no heavy borders, clean spacings).
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
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  } as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-xl mx-auto p-10 bg-transparent relative select-none"
    >
      {/* Hero WPM */}
      <motion.div variants={itemVariants} className="text-center mb-10">
        <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-heading font-bold mb-3">
          Decryption Completed
        </h2>
        <div className="flex justify-center items-baseline gap-2">
          <span className="text-7xl font-heading font-extrabold text-accent leading-none tracking-tighter">
            {result.wpm}
          </span>
          <span className="text-sm text-text-secondary font-mono">WPM</span>
        </div>
      </motion.div>

      {/* Stats Table Grid - Clean border separations */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-y-8 gap-x-6 mb-10 border-t border-b border-border py-8"
      >
        <div className="text-center">
          <span className="block text-[9px] uppercase tracking-wider text-text-muted font-heading font-bold mb-1">
            Accuracy
          </span>
          <span className="text-2xl font-mono text-text-primary">
            {result.accuracy}%
          </span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] uppercase tracking-wider text-text-muted font-heading font-bold mb-1">
            Time Taken
          </span>
          <span className="text-2xl font-mono text-text-primary">
            {result.duration.toFixed(1)}s
          </span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] uppercase tracking-wider text-text-muted font-heading font-bold mb-1">
            Keystrokes
          </span>
          <span className="text-lg font-mono text-text-primary">
            <span className="text-correct font-semibold">{result.correctKeystrokes}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-text-secondary">{result.totalKeystrokes}</span>
          </span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] uppercase tracking-wider text-text-muted font-heading font-bold mb-1">
            Words Decoded
          </span>
          <span className="text-2xl font-mono text-text-primary">
            {result.wordsCompleted}
          </span>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div variants={itemVariants} className="flex gap-6 justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-2 rounded-lg bg-text-primary text-bg hover:opacity-90 transition-all font-heading font-semibold text-xs cursor-pointer shadow-sm"
        >
          Try Again
        </button>
        <button
          onClick={onNewSession}
          className="px-6 py-2 rounded-lg border border-border bg-transparent text-text-secondary hover:text-text-primary transition-all font-heading font-semibold text-xs cursor-pointer"
        >
          New Session
        </button>
      </motion.div>
    </motion.div>
  )
}
