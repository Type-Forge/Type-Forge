"use client"

import { useEffect } from "react"
import type { SessionConfig } from "@/types"
import { WORD_COUNT_OPTIONS, TIME_DURATION_OPTIONS } from "@/lib/constants"
import { useTypingStore } from "@/stores/typing-store"
import { useBattleStore } from "@/stores/battle-store"
import { motion } from "motion/react"

interface ModeSelectorProps {
  onSelect: (config: SessionConfig) => void
  currentConfig: SessionConfig
}

/**
 * Centered selector tabs for choosing Words mode, Timed mode, or Battle mode.
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
        } else if (currentConfig.mode === "timed") {
          onSelect({ mode: "timed", duration: 60 })
        }
      } else if (key === "2") {
        if (currentConfig.mode === "words") {
          onSelect({ mode: "words", wordCount: 50 })
        } else if (currentConfig.mode === "timed") {
          onSelect({ mode: "timed", duration: 180 })
        }
      } else if (key === "3") {
        if (currentConfig.mode === "words") {
          onSelect({ mode: "words", wordCount: 75 })
        } else if (currentConfig.mode === "timed") {
          onSelect({ mode: "timed", duration: 300 })
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentConfig, onSelect, isInactive])

  const selectMode = (mode: "words" | "timed" | "battle" | "drill") => {
    if (mode === "words") {
      onSelect({ mode: "words", wordCount: 25 })
    } else if (mode === "timed") {
      onSelect({ mode: "timed", duration: 60 })
    } else if (mode === "battle") {
      onSelect({ mode: "battle", wordCount: 25 })
      useBattleStore.getState().resetBattle()
    } else {
      onSelect({ mode: "drill", difficulty: "easy" })
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
      {/* iOS Segmented Control with spring layout indicator */}
      <div className="bg-surface-secondary p-0.5 rounded-[8px] flex items-center justify-center gap-0.5 border border-border/10 relative">
        <button
          onClick={() => selectMode("words")}
          className={`text-[15px] font-semibold px-5 py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer relative ${
            currentConfig.mode === "words"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {currentConfig.mode === "words" && (
            <motion.div
              layoutId="active-mode-bg"
              className="absolute inset-0 bg-surface rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ zIndex: 1 }}
            />
          )}
          <span className="relative z-10">Words</span>
        </button>

        <button
          onClick={() => selectMode("timed")}
          className={`text-[15px] font-semibold px-5 py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer relative ${
            currentConfig.mode === "timed"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {currentConfig.mode === "timed" && (
            <motion.div
              layoutId="active-mode-bg"
              className="absolute inset-0 bg-surface rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ zIndex: 1 }}
            />
          )}
          <span className="relative z-10">Timed</span>
        </button>

        <button
          onClick={() => selectMode("battle")}
          className={`text-[15px] font-semibold px-5 py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer relative ${
            currentConfig.mode === "battle"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {currentConfig.mode === "battle" && (
            <motion.div
              layoutId="active-mode-bg"
              className="absolute inset-0 bg-surface rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ zIndex: 1 }}
            />
          )}
          <span className="relative z-10">Battle</span>
        </button>

        <button
          onClick={() => selectMode("drill")}
          className={`text-[15px] font-semibold px-5 py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer relative ${
            currentConfig.mode === "drill"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {currentConfig.mode === "drill" && (
            <motion.div
              layoutId="active-mode-bg"
              className="absolute inset-0 bg-surface rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ zIndex: 1 }}
            />
          )}
          <span className="relative z-10">Drill</span>
        </button>
      </div>

      {/* count limit configurations - Styled as clean sans-serif */}
      <div className="flex items-center justify-center gap-6 min-h-[20px]">
        {currentConfig.mode === "words" ? (
          WORD_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => selectWordOption(count as 25 | 50 | 75)}
              className={`text-sm font-semibold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                currentConfig.wordCount === count
                  ? "text-accent font-bold"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {count}
            </button>
          ))
        ) : currentConfig.mode === "timed" ? (
          TIME_DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => selectTimeOption(duration as 60 | 180 | 300)}
              className={`text-sm font-semibold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                currentConfig.duration === duration
                  ? "text-accent font-bold"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {duration}s
            </button>
          ))
        ) : currentConfig.mode === "drill" ? (
          (["easy", "medium", "hard"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => onSelect({ ...currentConfig, difficulty: diff })}
              className={`text-sm font-semibold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer capitalize ${
                currentConfig.difficulty === diff
                  ? "text-accent font-bold"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {diff}
            </button>
          ))
        ) : null}
      </div>
    </div>
  )
}

