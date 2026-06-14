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
 * Supports hotkeys 1, 2, and 3 when not in active typing sessions.
 */
export default function ModeSelector({ onSelect, currentConfig }: ModeSelectorProps) {
  const status = useTypingStore((s) => s.status)
  const isInactive = status === "idle" || status === "ready"

  useEffect(() => {
    if (!isInactive) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Avoid firing when modifiers are pressed
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
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Mode Tabs */}
      <div className="flex bg-surface border border-border rounded-lg p-1">
        <button
          onClick={() => onSelect({ mode: "words", wordCount: 25 })}
          className={`px-4 py-1.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            currentConfig.mode === "words"
              ? "bg-accent text-bg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Words
        </button>
        <button
          onClick={() => onSelect({ mode: "timed", duration: 60 })}
          className={`px-4 py-1.5 rounded-md text-xs font-heading font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            currentConfig.mode === "timed"
              ? "bg-accent text-bg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Timed
        </button>
      </div>

      {/* Suboptions buttons */}
      <div className="flex gap-2">
        {currentConfig.mode === "words" ? (
          WORD_COUNT_OPTIONS.map((count, idx) => (
            <button
              key={count}
              onClick={() => onSelect({ mode: "words", wordCount: count })}
              className={`px-4 py-1 text-sm font-mono rounded-md border transition-all cursor-pointer ${
                currentConfig.wordCount === count
                  ? "bg-accent-soft border-accent text-accent font-bold"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <span className="text-xs opacity-60 mr-1">({idx + 1})</span> {count}
            </button>
          ))
        ) : (
          TIME_DURATION_OPTIONS.map((duration, idx) => (
            <button
              key={duration}
              onClick={() => onSelect({ mode: "timed", duration: duration })}
              className={`px-4 py-1 text-sm font-mono rounded-md border transition-all cursor-pointer ${
                currentConfig.duration === duration
                  ? "bg-accent-soft border-accent text-accent font-bold"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <span className="text-xs opacity-60 mr-1">({idx + 1})</span> {duration / 60}:00
            </button>
          ))
        )}
      </div>
    </div>
  )
}
