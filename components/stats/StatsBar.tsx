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
 * Floating StatsBar below typing area, containing zero background boundaries.
 */
export default function StatsBar({ wpm, accuracy, time, mode }: StatsBarProps) {
  const status = useTypingStore((s) => s.status)
  const startTime = useTypingStore((s) => s.startTime)
  const currentWordIndex = useTypingStore((s) => s.currentWordIndex)
  const words = useTypingStore((s) => s.words)
  const [elapsed, setElapsed] = useState(0)

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

  const displayTime = mode === "timed" ? formatTime(time ?? 0) : formatTime(elapsed)

  // Array map representation
  const statsList = [
    { label: mode === "timed" ? "remaining" : "time", value: displayTime },
    { label: "wpm", value: wpm },
    { label: "accuracy", value: `${accuracy}%` },
    ...(mode === "words" ? [{ label: "progress", value: `${currentWordIndex}/${words.length}` }] : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-8 mt-8 select-none"
    >
      {statsList.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1 text-center">
          <motion.span
            key={value}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-mono tabular-nums text-text-primary"
          >
            {value}
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-text-muted font-heading font-semibold">
            {label}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
