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
 * TypingArea wraps the typing canvas.
 * Floats words in space with zero borders, backgrounds, or shadows.
 */
export default function TypingArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const { words, currentWordIndex, currentLetterIndex, status } = useTypingStore()
  const { handleKeyDown } = useTypingEngine()

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
      if (offsetTop >= 80) {
        setScrollY(-(offsetTop - 40))
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
      setScrollY(0)
    }
  }, [status])

  return (
    <div className="relative w-full my-8">
      {/* Focus lock overlay */}
      {!isFocused && (
        <div
          onClick={focusContainer}
          className="absolute inset-0 z-20 flex items-center justify-center bg-bg/60 backdrop-blur-[2px] rounded-xl cursor-pointer transition-opacity duration-200"
        >
          <span className="text-sm text-text-muted">
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
        className="w-full min-h-[180px] max-h-[180px] overflow-hidden py-8 px-4 bg-transparent outline-none border-none focus:outline-none focus:ring-0 relative font-mono text-[22px] leading-[1.8] tracking-[0.04em] select-none cursor-text"
        onClick={focusContainer}
      >
        <motion.div
          animate={{ y: scrollY }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="w-full flex flex-wrap"
        >
          <WordDisplay words={words} currentWordIndex={currentWordIndex} />
        </motion.div>

        {/* Floating Caret */}
        {isFocused && status !== "finished" && (
          <Caret position={caretPosition} />
        )}
      </div>

      {/* Footer tips */}
      {status === "running" && (
        <div className="flex justify-between mt-4 px-1 text-[9px] uppercase font-semibold text-text-muted font-heading tracking-widest">
          <span>esc / tab to restart</span>
          <span>bletchley decrypt mode</span>
        </div>
      )}
    </div>
  )
}
