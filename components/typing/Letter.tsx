"use client"

import { memo, useState, useEffect } from "react"
import { motion } from "motion/react"
import type { LetterData } from "@/types"

interface LetterProps {
  letter: LetterData
  wordIndex: number
  letterIndex: number
}

/**
 * Letter component with foreground/background layers.
 * Correct letters are styled as primary text color (no green) for a clean monochrome layout.
 */
export const Letter = memo(
  function Letter({ letter, wordIndex, letterIndex }: LetterProps) {
    const { char, cipherChar, state } = letter
    const [displayedChar, setDisplayedChar] = useState(char)

    useEffect(() => {
      if (state === "correct") {
        setDisplayedChar(cipherChar)
        const timer = setTimeout(() => {
          setDisplayedChar(char)
        }, 80)
        return () => clearTimeout(timer)
      } else {
        setDisplayedChar(char)
      }
    }, [state, char, cipherChar])

    // Minimal color states
    let colorClass = "text-text-muted"
    if (state === "active") {
      colorClass = "text-text-secondary"
    } else if (state === "correct") {
      colorClass = "text-text-primary"
    } else if (state === "incorrect") {
      colorClass = "text-incorrect"
    } else if (state === "extra") {
      colorClass = "text-incorrect opacity-50"
    }

    const isCorrect = state === "correct"

    return (
      <span className="relative inline-block select-none font-mono px-[1px]">
        {/* Subtle, faint background cipher grid text */}
        {(state === "pending" || state === "active") && (
          <span className="absolute inset-0 text-[10px] text-accent/10 flex items-center justify-center font-mono select-none pointer-events-none transform -translate-y-[2px]">
            {cipherChar}
          </span>
        )}

        {/* Foreground letter */}
        <motion.span
          data-word-index={wordIndex}
          data-letter-index={letterIndex}
          className={`inline-block transition-colors duration-150 ${colorClass}`}
          animate={isCorrect ? { rotateX: [0, 90, 0] } : { rotateX: 0 }}
          transition={{ duration: 0.16, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {state === "extra" ? char : displayedChar}
        </motion.span>
      </span>
    )
  },
  (prev, next) =>
    prev.letter.state === next.letter.state &&
    prev.letter.char === next.letter.char &&
    prev.letter.cipherChar === next.letter.cipherChar
)
