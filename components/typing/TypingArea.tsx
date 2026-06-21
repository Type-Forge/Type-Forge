"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import Caret from "./Caret"
import WordDisplay from "./WordDisplay"
import { useTypingStore } from "@/stores/typing-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useCaret } from "@/hooks/useCaret"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useKeyboardHandler } from "@/hooks/useKeyboardHandler"
import { useBattleStore } from "@/stores/battle-store"

interface AiCaretProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  wordIndex: number
  letterIndex: number
}

/**
 * AI Caret rendering. Positions a neutral-shade gray caret mapping to opponent progress.
 */
function AiCaret({ containerRef, wordIndex, letterIndex }: AiCaretProps) {
  const position = useCaret(containerRef, wordIndex, letterIndex)
  
  return (
    <motion.div
      className="absolute top-0 left-0 w-[3px] rounded-full bg-[#8e8e93] dark:bg-[#d1d1d6] opacity-100 z-10 pointer-events-none"
      animate={{
        transform: `translate(${position.left}px, ${position.top}px)`,
      }}
      transition={{
        transform: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
      }}
      style={{
        height: position.height,
        transformOrigin: "center left",
      }}
    />
  )
}

function getAiPosition(words: any[], progress: number) {
  if (!words || words.length === 0) return { wordIndex: 0, letterIndex: 0 }

  const positions: { wordIndex: number; letterIndex: number }[] = []
  words.forEach((word) => {
    word.letters.forEach((_: any, lIdx: number) => {
      positions.push({ wordIndex: word.index, letterIndex: lIdx })
    })
    positions.push({ wordIndex: word.index, letterIndex: word.letters.length })
  })

  if (positions.length === 0) return { wordIndex: 0, letterIndex: 0 }

  const targetIdx = Math.min(
    Math.floor(progress * positions.length),
    positions.length - 1
  )
  return positions[targetIdx]
}

/**
 * TypingArea wraps the typing canvas.
 * Optimized: subscribes only to words, currentWordIndex, currentLetterIndex, and status.
 * Does NOT call useTypingEngine (called in page.tsx to avoid double-subscription).
 */
export default function TypingArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const fontSize = useSettingsStore((s) => s.fontSize)
  const textWidth = useSettingsStore((s) => s.textWidth)

  // Granular subscriptions — only the fields this component renders
  const words = useTypingStore((s) => s.words)
  const currentWordIndex = useTypingStore((s) => s.currentWordIndex)
  const currentLetterIndex = useTypingStore((s) => s.currentLetterIndex)
  const status = useTypingStore((s) => s.status)
  const configMode = useTypingStore((s) => s.config.mode)

  // Get stable handleKeyDown — won't re-create on every keystroke
  const { handleKeyDown } = useTypingEngine()

  // Battle AI caret — only subscribe when in battle mode
  const battleStatus = useBattleStore((s) => s.status)
  const aiProgress = useBattleStore((s) => s.aiProgress)
  // Guard: configMode must be "battle" — battleStatus stays "racing" across mode switches
  const isBattleMode = configMode === "battle" && (battleStatus === "racing" || battleStatus === "finished")

  // Intercept keyboard events
  useKeyboardHandler(containerRef, handleKeyDown, isFocused)

  // Caret position — only recalculates when word/letter index changes
  const caretPosition = useCaret(innerRef, currentWordIndex, currentLetterIndex)

  // Memoize AI position — avoid recomputing every render
  const aiPos = useMemo(
    () => (isBattleMode ? getAiPosition(words, aiProgress) : null),
    [isBattleMode, words, aiProgress]
  )

  const focusContainer = () => containerRef.current?.focus()

  // Auto focus on new session
  useEffect(() => {
    if (status === "ready" || status === "idle") {
      focusContainer()
    }
  }, [status])

  // Scroll to keep active word visible
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const activeWordEl = container.querySelector(
      `[data-word-index="${currentWordIndex}"]`
    ) as HTMLElement | null

    if (activeWordEl) {
      const offsetTop = activeWordEl.offsetTop
      const wrapperEl = container.querySelector("[data-word-index]")?.parentElement as HTMLElement | null
      const wrapperHeight = wrapperEl ? wrapperEl.clientHeight : 0

      if (wrapperHeight <= 260) {
        setScrollY(0)
        return
      }

      setScrollY(offsetTop > 0 ? -offsetTop : 0)
    } else {
      setScrollY(0)
    }
  }, [currentWordIndex])

  // Reset scroll on new session
  useEffect(() => {
    if (status === "ready") {
      requestAnimationFrame(() => setScrollY(0))
    }
  }, [status])

  return (
    <div className="relative w-full my-4 p-0">
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full min-h-[272px] max-h-[272px] overflow-hidden py-4 px-0 bg-transparent outline-none border-none focus:outline-none focus:ring-0 relative font-sans font-medium leading-[1.6] tracking-[0.06em] select-none cursor-text ${
          textWidth === "narrow"
            ? "max-w-4xl mx-auto"
            : textWidth === "medium"
            ? "max-w-6xl mx-auto"
            : "w-full max-w-none"
        }`}
        style={{ fontSize: `${fontSize}px` }}
        onClick={focusContainer}
      >
        <motion.div
          ref={innerRef}
          animate={{ y: scrollY }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full flex flex-wrap relative"
        >
          <WordDisplay words={words} currentWordIndex={currentWordIndex} />

          {/* Floating Caret */}
          {isFocused && status !== "finished" && (
            <Caret position={caretPosition} />
          )}

          {/* AI Ghost Caret (Battle Mode) */}
          {isBattleMode && status !== "finished" && aiPos && (
            <AiCaret
              containerRef={innerRef}
              wordIndex={aiPos.wordIndex}
              letterIndex={aiPos.letterIndex}
            />
          )}
        </motion.div>
      </div>

      {/* Footer tips */}
      {status === "running" && (
        <div className="flex justify-center mt-6 px-1 text-xs font-medium text-text-tertiary font-sans">
          <span>Press Esc / Tab to restart</span>
        </div>
      )}
    </div>
  )
}
