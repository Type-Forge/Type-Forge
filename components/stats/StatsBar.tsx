"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import { formatTime } from "@/lib/utils"

interface StatsBarProps {
  wpm: number
  accuracy: number
  time: number | null
  mode: "words" | "timed" | "battle" | "drill"
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
      requestAnimationFrame(() => setElapsed(0))
      return
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 500)

    return () => clearInterval(interval)
  }, [status, startTime])

  if (status !== "running") return null

  const isTimed = mode === "timed" || (mode === "drill" && time !== null)
  const displayTime = isTimed ? formatTime(time ?? 0) : formatTime(elapsed)

  // Array map representation
  const statsList = [
    { label: isTimed ? "remaining" : "time", value: displayTime },
    { label: "wpm", value: wpm },
    { label: "accuracy", value: `${accuracy}%` },
    ...(mode === "words" || mode === "battle" || mode === "drill" ? [{ label: "progress", value: `${currentWordIndex}/${words.length}` }] : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-4 mt-8 select-none flex-wrap"
    >
      {statsList.map(({ label, value }) => (
        <div
          key={label}
          className="w-[140px] h-[84px] rounded-[24px] bg-surface border border-border flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors duration-150 animate-fade-in"
        >
          <motion.span
            key={value}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="text-[34px] font-sans font-bold tracking-tight leading-none text-text-primary tabular-nums"
          >
            {value}
          </motion.span>
          <span className="text-[13px] font-sans font-medium text-text-secondary mt-1">
            {label}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
