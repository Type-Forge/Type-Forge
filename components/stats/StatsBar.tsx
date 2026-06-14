"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import { formatTime } from "@/lib/utils"

interface StatsBarProps {
  wpm: number
  accuracy: number
  time: number | null
  mode: "words" | "timed"
}

/**
 * StatsBar displays live WPM, Accuracy, and Time metrics.
 * Triggers subtle pop animations using framer-motion key triggers.
 */
export default function StatsBar({ wpm, accuracy, time, mode }: StatsBarProps) {
  const status = useTypingStore((s) => s.status)
  const startTime = useTypingStore((s) => s.startTime)
  const currentWordIndex = useTypingStore((s) => s.currentWordIndex)
  const words = useTypingStore((s) => s.words)
  const [elapsed, setElapsed] = useState(0)

  // Live timer for words mode (showing elapsed seconds)
  useEffect(() => {
    if (status !== "running" || !startTime) {
      setElapsed(0)
      return
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 500)

    return () => clearInterval(interval)
  }, [status, startTime])

  if (status !== "running") return null

  // Format time remaining for timed mode, or elapsed time for words mode
  const displayTime = mode === "timed" ? formatTime(time ?? 0) : formatTime(elapsed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center gap-12 py-3 bg-surface/50 border border-border/50 rounded-xl max-w-lg mx-auto my-4 shadow-sm"
    >
      {/* Time Metric */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-muted">
          {mode === "timed" ? "Time Left" : "Time"}
        </span>
        <motion.span
          key={displayTime}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="font-mono text-2xl text-text-primary font-bold"
        >
          {displayTime}
        </motion.span>
      </div>

      {/* WPM Metric */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-muted">
          WPM
        </span>
        <motion.span
          key={wpm}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="font-mono text-2xl text-text-primary font-bold"
        >
          {wpm}
        </motion.span>
      </div>

      {/* Accuracy Metric */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-muted">
          Accuracy
        </span>
        <motion.span
          key={accuracy}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="font-mono text-2xl text-text-primary font-bold"
        >
          {accuracy}%
        </motion.span>
      </div>

      {/* Progress Metric (only in words mode) */}
      {mode === "words" && (
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-muted">
            Progress
          </span>
          <span className="font-mono text-2xl text-text-primary font-bold">
            {currentWordIndex}/{words.length}
          </span>
        </div>
      )}
    </motion.div>
  )
}
