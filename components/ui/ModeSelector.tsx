"use client"

import { useEffect, useRef, useState } from "react"
import type { SessionConfig, WordCount, TimeDuration, BattleDifficulty } from "@/types"
import { WORD_COUNT_OPTIONS, TIME_DURATION_OPTIONS } from "@/lib/constants"
import { useTypingStore } from "@/stores/typing-store"
import { useBattleStore } from "@/stores/battle-store"
import SubOptionSelector, { type SubOption } from "@/components/ui/SubOptionSelector"

interface ModeSelectorProps {
  onSelect: (config: SessionConfig) => void
  currentConfig: SessionConfig
}

const MODES = ["words", "timed", "battle", "drill", "yolo"] as const
type Mode = (typeof MODES)[number]

const WORD_OPTIONS: SubOption<WordCount>[] = WORD_COUNT_OPTIONS.map((count) => ({
  value: count as WordCount,
  label: String(count),
  tooltip: `${count} words typing test. Quick sprint/practice.`,
}))

const TIME_OPTIONS: SubOption<TimeDuration>[] = TIME_DURATION_OPTIONS.map((duration) => ({
  value: duration as TimeDuration,
  label: `${duration}s`,
  tooltip: `${duration / 60} minute countdown challenge.`,
}))

const BATTLE_OPTIONS: SubOption<BattleDifficulty>[] = [
  {
    value: "easy",
    label: "easy (35 wpm)",
    tooltip: "Slower opponent speed. Great for warming up.",
  },
  {
    value: "medium",
    label: "medium (60 wpm)",
    tooltip: "Standard opponent pace. A solid challenge.",
  },
  {
    value: "hard",
    label: "hard (90 wpm)",
    tooltip: "Elite opponent speed. Only for experienced typists.",
  },
]

/**
 * Centered selector tabs for choosing Words / Timed / Battle / Drill modes.
 * Uses a single persistent sliding pill indicator — never unmounts — for instant snappy transitions.
 */
export default function ModeSelector({ onSelect, currentConfig }: ModeSelectorProps) {
  const status = useTypingStore((s) => s.status)
  const isInactive = status === "idle" || status === "ready"

  const containerRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

  // Slide the pill to the active mode button
  useEffect(() => {
    const idx = MODES.indexOf(currentConfig.mode as Mode)
    const btn = btnRefs.current[idx]
    const container = containerRef.current
    if (!btn || !container) return

    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
      opacity: 1,
    })
  }, [currentConfig.mode])

  useEffect(() => {
    if (!isInactive) return
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key
      if (key === "1") {
        if (currentConfig.mode === "words") onSelect({ mode: "words", wordCount: 25 })
        else if (currentConfig.mode === "timed") onSelect({ mode: "timed", duration: 60 })
      } else if (key === "2") {
        if (currentConfig.mode === "words") onSelect({ mode: "words", wordCount: 50 })
        else if (currentConfig.mode === "timed") onSelect({ mode: "timed", duration: 180 })
      } else if (key === "3") {
        if (currentConfig.mode === "words") onSelect({ mode: "words", wordCount: 75 })
        else if (currentConfig.mode === "timed") onSelect({ mode: "timed", duration: 300 })
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentConfig, onSelect, isInactive])

  const selectMode = (mode: Mode) => {
    if (mode === "words") {
      onSelect({ mode: "words", wordCount: 25 })
    } else if (mode === "timed") {
      onSelect({ mode: "timed", duration: 60 })
    } else if (mode === "battle") {
      useBattleStore.getState().resetBattle()
      onSelect({ mode: "battle", difficulty: "easy", wordCount: 25 })
    } else if (mode === "drill") {
      onSelect({ mode: "drill", difficulty: "easy" })
    } else if (mode === "yolo") {
      onSelect({ mode: "yolo" })
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-3 select-none">
      {/* iOS Segmented Control — single persistent sliding pill */}
      <div
        ref={containerRef}
        className="bg-surface-secondary p-0.5 rounded-[8px] flex items-center justify-center gap-0.5 border border-border/10 relative"
      >
        {/* Sliding pill — never unmounts, just translates */}
        <div
          className="absolute top-0.5 bottom-0.5 bg-surface rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)] pointer-events-none"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            opacity: pillStyle.opacity,
            transition: "left 180ms cubic-bezier(0.25,0.46,0.45,0.94), width 180ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />

        {MODES.map((mode, idx) => (
          <button
            key={mode}
            ref={(el) => { btnRefs.current[idx] = el }}
            onClick={() => selectMode(mode)}
            className={`text-[15px] font-semibold px-5 py-1 rounded-[6px] transition-colors duration-100 active:scale-[0.97] cursor-pointer relative z-10 focus:outline-none ${
              currentConfig.mode === mode
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Sub-option row */}
      <div className="flex items-center justify-center gap-6 min-h-[20px] mt-2">
        {currentConfig.mode === "words" ? (
          <SubOptionSelector
            options={WORD_OPTIONS}
            selected={currentConfig.wordCount || 25}
            onSelect={(val) => onSelect({ mode: "words", wordCount: val })}
          />
        ) : currentConfig.mode === "timed" ? (
          <SubOptionSelector
            options={TIME_OPTIONS}
            selected={currentConfig.duration || 60}
            onSelect={(val) => onSelect({ mode: "timed", duration: val })}
          />
        ) : currentConfig.mode === "battle" ? (
          <SubOptionSelector
            options={BATTLE_OPTIONS}
            selected={(currentConfig.difficulty as BattleDifficulty) || "easy"}
            onSelect={(val) => {
              onSelect({ ...currentConfig, difficulty: val })
              useBattleStore.getState().initBattle(val, 25)
            }}
          />
        ) : currentConfig.mode === "drill" ? (
          <span className="text-[14px] font-bold text-text-primary select-none">
            Custom Drill Builder
          </span>
        ) : currentConfig.mode === "yolo" ? (
          <span className="text-[14px] font-bold text-text-primary select-none">
            YOLO Mode &middot; Endless Adaptive Training
          </span>
        ) : null}
      </div>
    </div>
  )
}
