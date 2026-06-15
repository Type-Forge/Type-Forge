"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "motion/react"
import Caret from "./Caret"
import WordDisplay from "./WordDisplay"
import { useTypingStore } from "@/stores/typing-store"
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
      className="absolute top-0 left-0 w-[3px] rounded-full bg-text-tertiary opacity-45 z-10 pointer-events-none"
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
 * Floats words in space with zero borders, backgrounds, or shadows.
 */
export default function TypingArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const { words, currentWordIndex, currentLetterIndex, status } = useTypingStore()
  const { handleKeyDown } = useTypingEngine()

  const battleStatus = useBattleStore((s) => s.status)
  const aiProgress = useBattleStore((s) => s.aiProgress)
  const isBattleMode = battleStatus === "racing" || battleStatus === "finished"

  // Intercept keyboard events
  useKeyboardHandler(containerRef, handleKeyDown, isFocused)

  // Track coordinates of caret position
  const caretPosition = useCaret(containerRef, currentWordIndex, currentLetterIndex)

  // Focus trigger
  const focusContainer = () => {
    containerRef.current?.focus()
  }

  // Auto focus triggers
  useEffect(() => {
    if (status === "ready" || status === "idle") {
      focusContainer()
    }
  }, [status])

  // Scroll logic for shifting rows
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

      // If the entire text content fits within the container height (168px inner), keep it fixed!
      if (wrapperHeight <= 168) {
        setScrollY(0)
        return
      }

      // Row height is exactly 84.2px (72.2px line height + 4px word padding + 8px flex gap)
      const lineIndex = Math.round(offsetTop / 84.2)
      if (lineIndex > 0) {
        setScrollY(-lineIndex * 84.2)
      } else {
        setScrollY(0)
      }
    } else {
      setScrollY(0)
    }
  }, [currentWordIndex])

  // Reset scroll position on new sessions
  useEffect(() => {
    if (status === "ready") {
      requestAnimationFrame(() => setScrollY(0))
    }
  }, [status])

  return (
    <div className="relative w-full my-8 bg-surface border border-border rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-12">
      {/* Focus lock overlay */}
      {!isFocused && status !== "finished" && (
        <div
          onClick={focusContainer}
          className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-[4px] rounded-[32px] cursor-pointer transition-opacity duration-200"
        >
          <span className="text-sm font-sans font-semibold text-text-secondary tracking-wide">
            click to focus
          </span>
        </div>
      )}

      {/* Invisible text box container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full min-h-[200px] max-h-[200px] overflow-hidden py-4 px-0 bg-transparent outline-none border-none focus:outline-none focus:ring-0 relative font-sans text-[38px] font-medium leading-[1.9] tracking-[-0.03em] select-none cursor-text"
        onClick={focusContainer}
      >
        <motion.div
          animate={{ y: scrollY }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full flex flex-wrap"
        >
          <WordDisplay words={words} currentWordIndex={currentWordIndex} />
        </motion.div>

        {/* Floating Caret */}
        {isFocused && status !== "finished" && (
          <Caret position={caretPosition} />
        )}

        {/* AI Caret (Battle Mode) */}
        {isBattleMode && status !== "finished" && (
          <AiCaret
            containerRef={containerRef}
            wordIndex={getAiPosition(words, aiProgress).wordIndex}
            letterIndex={getAiPosition(words, aiProgress).letterIndex}
          />
        )}
      </div>

      {/* Footer tips */}
      {status === "running" && (
        <div className="flex justify-between mt-6 px-1 text-xs font-medium text-text-tertiary font-sans">
          <span>Press Esc / Tab to restart</span>
          <span>Bletchley decrypt mode</span>
        </div>
      )}
    </div>
  )
}
