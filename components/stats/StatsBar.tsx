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
 * StatsBar displays live metrics during typing tests.
 * Floating clean text metrics without borders and background panels.
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center items-center gap-16 py-4 max-w-lg mx-auto my-4 text-center select-none"
    >
      {/* Time Metric */}
      <div className="flex flex-col">
        <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted mb-1">
          {mode === "timed" ? "Remaining" : "Time"}
        </span>
        <motion.span
          key={displayTime}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xl text-text-primary"
        >
          {displayTime}
        </motion.span>
      </div>

      {/* WPM Metric */}
      <div className="flex flex-col">
        <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted mb-1">
          WPM
        </span>
        <motion.span
          key={wpm}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xl text-accent"
        >
          {wpm}
        </motion.span>
      </div>

      {/* Accuracy Metric */}
      <div className="flex flex-col">
        <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted mb-1">
          Accuracy
        </span>
        <motion.span
          key={accuracy}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xl text-text-primary"
        >
          {accuracy}%
        </motion.span>
      </div>

      {/* Progress Metric */}
      {mode === "words" && (
        <div className="flex flex-col">
          <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted mb-1">
            Progress
          </span>
          <span className="font-mono text-xl text-text-primary">
            {currentWordIndex}/{words.length}
          </span>
        </div>
      )}
    </motion.div>
  )
}
