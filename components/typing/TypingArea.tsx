"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "motion/react"
import Caret from "./Caret"
import WordDisplay from "./WordDisplay"
import { useTypingStore } from "@/stores/typing-store"
import { useCaret } from "@/hooks/useCaret"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useKeyboardHandler } from "@/hooks/useKeyboardHandler"

/**
 * TypingArea wraps the typing interface.
 * Implements click-to-focus events, handles unfocused cover cards,
 * and tracks layout scroll heights dynamically to shift typed lines out of view.
 */
export default function TypingArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const { words, currentWordIndex, currentLetterIndex, status, resetSession } = useTypingStore()
  const { handleKeyDown } = useTypingEngine()

  // Attach keydown listener to the container when focused
  useKeyboardHandler(containerRef, handleKeyDown, isFocused)

  // Track caret position relative to the container
  const caretPosition = useCaret(containerRef, currentWordIndex, currentLetterIndex)

  // Focus utility
  const focusContainer = () => {
    containerRef.current?.focus()
  }

  // Auto-focus on mount and session reset
  useEffect(() => {
    if (status === "ready" || status === "idle") {
      focusContainer()
    }
  }, [status])

  // Manage scrolling logic when the active word index shifts
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const activeWordEl = container.querySelector(
      `[data-word-index="${currentWordIndex}"]`
    ) as HTMLElement | null

    if (activeWordEl) {
      const offsetTop = activeWordEl.offsetTop
      // A standard line height is ~40px.
      // If the active word moves to the 3rd line (offsetTop >= 80px),
      // we translate the words view container upwards to keep it aligned to the 2nd line.
      if (offsetTop >= 80) {
        setScrollY(-(offsetTop - 40))
      } else {
        setScrollY(0)
      }
    } else {
      setScrollY(0)
    }
  }, [currentWordIndex])

  // Reset scroll when session resets
  useEffect(() => {
    if (status === "ready") {
      setScrollY(0)
    }
  }, [status])

  return (
    <div className="relative w-full my-8">
      {/* Click-to-focus overlay */}
      {!isFocused && (
        <div
          onClick={focusContainer}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/85 backdrop-blur-[2px] rounded-xl border border-border cursor-pointer transition-all hover:bg-bg/90"
        >
          <span className="text-sm font-heading font-semibold uppercase tracking-widest text-accent animate-pulse">
            Click or press any key to focus
          </span>
        </div>
      )}

      {/* Typing box */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full min-h-[160px] max-h-[160px] overflow-hidden p-6 bg-surface border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-accent relative font-mono text-[22px] leading-[1.8] tracking-[0.05em] select-none"
      >
        <motion.div
          animate={{ y: scrollY }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="w-full flex flex-wrap"
        >
          <WordDisplay words={words} currentWordIndex={currentWordIndex} />
        </motion.div>

        {/* Dynamic Caret */}
        {isFocused && status !== "finished" && (
          <Caret position={caretPosition} />
        )}
      </div>

      {/* Helper tips when running */}
      {status === "running" && (
        <div className="flex justify-between mt-2 px-1 text-[10px] uppercase font-semibold text-text-muted font-heading tracking-widest">
          <span>Press Esc or Tab to restart</span>
          <span>Decode substitution cipher</span>
        </div>
      )}
    </div>
  )
}
