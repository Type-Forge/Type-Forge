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
 * Uses clean design lines and subtle borders, following Emil's philosophy.
 */
export default function TypingArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const { words, currentWordIndex, currentLetterIndex, status } = useTypingStore()
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
      // standard line height shifts
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
    <div className="relative w-full my-12">
      {/* Click-to-focus overlay - minimal overlay */}
      {!isFocused && (
        <div
          onClick={focusContainer}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/50 backdrop-blur-[1px] cursor-pointer rounded-xl transition-all"
        >
          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-accent/80 hover:text-accent transition-colors">
            Press any key to focus
          </span>
        </div>
      )}

      {/* Typing box - clean padding, border-free / very low opacity border */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full min-h-[160px] max-h-[160px] overflow-hidden py-4 px-2 bg-transparent border-b border-border/40 focus:outline-none relative font-mono text-[22px] leading-[1.8] tracking-[0.04em] select-none"
      >
        <motion.div
          animate={{ y: scrollY }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
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
        <div className="flex justify-between mt-3 px-1 text-[9px] uppercase font-bold text-text-muted font-heading tracking-widest">
          <span>Esc / Tab to restart</span>
          <span>Bletchley Decrypt Mode</span>
        </div>
      )}
    </div>
  )
}
