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
 * Letter component displaying readable letters in the foreground and a faint
 * cipher character in the background. Flips to reveal the decoded letter.
 */
export const Letter = memo(
  function Letter({ letter, wordIndex, letterIndex }: LetterProps) {
    const { char, cipherChar, state } = letter
    const [displayedChar, setDisplayedChar] = useState(char)

    useEffect(() => {
      if (state === "correct") {
        // Play flip transition: start at cipher representation, midpoint swaps to real letter
        setDisplayedChar(cipherChar)
        const timer = setTimeout(() => {
          setDisplayedChar(char)
        }, 80)
        return () => clearTimeout(timer)
      } else {
        setDisplayedChar(char)
      }
    }, [state, char, cipherChar])

    let colorClass = "text-text-muted"
    if (state === "active") {
      colorClass = "text-text-primary font-medium"
    } else if (state === "correct") {
      colorClass = "text-text-primary"
    } else if (state === "incorrect") {
      colorClass = "text-incorrect"
    } else if (state === "extra") {
      colorClass = "text-incorrect opacity-70"
    }

    const isCorrect = state === "correct"

    return (
      <span className="relative inline-block select-none font-mono px-[1px]">
        {/* Subtle, faint background layer showing cipher text flavor */}
        {(state === "pending" || state === "active") && (
          <span className="absolute inset-0 text-[10px] text-accent/15 flex items-center justify-center font-mono select-none pointer-events-none transform -translate-y-[2px]">
            {cipherChar}
          </span>
        )}

        {/* Readable text character */}
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
