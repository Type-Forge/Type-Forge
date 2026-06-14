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
 * Styled without numbers for shortcut hints to keep visual weight light.
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

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Mode Tabs */}
      <div className="flex bg-transparent border border-border rounded-lg p-0.5">
        <button
          onClick={() => onSelect({ mode: "words", wordCount: 25 })}
          className={`px-4 py-1 rounded-md text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
            currentConfig.mode === "words"
              ? "bg-text-primary text-bg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Words
        </button>
        <button
          onClick={() => onSelect({ mode: "timed", duration: 60 })}
          className={`px-4 py-1 rounded-md text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
            currentConfig.mode === "timed"
              ? "bg-text-primary text-bg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Timed
        </button>
      </div>

      {/* Suboptions buttons */}
      <div className="flex gap-4">
        {currentConfig.mode === "words" ? (
          WORD_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => onSelect({ mode: "words", wordCount: count })}
              className={`text-sm font-mono transition-all cursor-pointer ${
                currentConfig.wordCount === count
                  ? "text-accent font-bold scale-105"
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
              onClick={() => onSelect({ mode: "timed", duration: duration })}
              className={`text-sm font-mono transition-all cursor-pointer ${
                currentConfig.duration === duration
                  ? "text-accent font-bold scale-105"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {duration / 60}:00
            </button>
          ))
        )}
      </div>
    </div>
  )
}
