"use client"

import { useEffect } from "react"
import type { SessionConfig } from "@/types"
import { WORD_COUNT_OPTIONS, TIME_DURATION_OPTIONS } from "@/lib/constants"
import { useTypingStore } from "@/stores/typing-store"

interface ModeSelectorProps {
  onSelect: (config: SessionConfig) => void
  currentConfig: SessionConfig
}

/**
 * Centered selector tabs for choosing Words mode or Timed mode.
 * Styled with larger text sizes (text-base) for better readability and tap targets.
 */
export default function ModeSelector({ onSelect, currentConfig }: ModeSelectorProps) {
  const status = useTypingStore((s) => s.status)
  const isInactive = status === "idle" || status === "ready"

  useEffect(() => {
    if (!isInactive) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key
      if (key === "1") {
        if (currentConfig.mode === "words") {
          onSelect({ mode: "words", wordCount: 25 })
        } else {
          onSelect({ mode: "timed", duration: 60 })
        }
      } else if (key === "2") {
        if (currentConfig.mode === "words") {
          onSelect({ mode: "words", wordCount: 50 })
        } else {
          onSelect({ mode: "timed", duration: 180 })
        }
      } else if (key === "3") {
        if (currentConfig.mode === "words") {
          onSelect({ mode: "words", wordCount: 75 })
        } else {
          onSelect({ mode: "timed", duration: 300 })
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentConfig, onSelect, isInactive])

  const selectMode = (mode: "words" | "timed") => {
    if (mode === "words") {
      onSelect({ mode: "words", wordCount: 25 })
    } else {
      onSelect({ mode: "timed", duration: 60 })
    }
  }

  const selectWordOption = (count: 25 | 50 | 75) => {
    onSelect({ mode: "words", wordCount: count })
  }

  const selectTimeOption = (duration: 60 | 180 | 300) => {
    onSelect({ mode: "timed", duration })
  }

  return (
    <div className="flex flex-col items-center gap-5 py-3 select-none">
      {/* Mode Switcher Tabs - Sized to text-base for readable presence */}
      <div className="flex items-center justify-center gap-8 mb-1">
        <button
          onClick={() => selectMode("words")}
          className={`text-base font-medium transition-colors duration-150 cursor-pointer ${
            currentConfig.mode === "words"
              ? "text-text-primary font-semibold"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          words
        </button>
        <button
          onClick={() => selectMode("timed")}
          className={`text-base font-medium transition-colors duration-150 cursor-pointer ${
            currentConfig.mode === "timed"
              ? "text-text-primary font-semibold"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          timed
        </button>
      </div>

      {/* count limit configurations */}
      <div className="flex items-center justify-center gap-6">
        {currentConfig.mode === "words" ? (
          WORD_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => selectWordOption(count as 25 | 50 | 75)}
              className={`text-[15px] font-mono tabular-nums transition-colors duration-150 cursor-pointer ${
                currentConfig.wordCount === count
                  ? "text-accent font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {count}
            </button>
          ))
        ) : (
          TIME_DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => selectTimeOption(duration as 60 | 180 | 300)}
              className={`text-[15px] font-mono tabular-nums transition-colors duration-150 cursor-pointer ${
                currentConfig.duration === duration
                  ? "text-accent font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {duration}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
