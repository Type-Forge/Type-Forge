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
 * Letter component representing a single character.
 * Performs a 3D-like flip on rotateX when correctly decoded, swapping the cipher
 * character for the decrypted character at the midpoint (80ms).
 */
export const Letter = memo(
  function Letter({ letter, wordIndex, letterIndex }: LetterProps) {
    const { char, cipherChar, state } = letter
    const [displayedChar, setDisplayedChar] = useState(cipherChar)

    useEffect(() => {
      if (state === "correct") {
        // Swap character at the midpoint of the flip animation (80ms)
        const timer = setTimeout(() => {
          setDisplayedChar(char)
        }, 80)
        return () => clearTimeout(timer)
      } else if (state === "pending" || state === "active") {
        setDisplayedChar(cipherChar)
      }
    }, [state, char, cipherChar])

    let colorClass = "text-text-muted"
    if (state === "active") {
      colorClass = "text-text-secondary font-semibold"
    } else if (state === "correct") {
      colorClass = "text-text-primary"
    } else if (state === "incorrect") {
      colorClass = "text-incorrect"
    } else if (state === "extra") {
      colorClass = "text-incorrect opacity-70"
    }

    const isCorrect = state === "correct"

    return (
      <motion.span
        data-word-index={wordIndex}
        data-letter-index={letterIndex}
        className={`inline-block select-none font-mono transition-colors duration-150 ${colorClass}`}
        animate={isCorrect ? { rotateX: [0, 90, 0] } : { rotateX: 0 }}
        transition={{ duration: 0.16, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {state === "extra" ? char : displayedChar}
      </motion.span>
    )
  },
  (prev, next) =>
    prev.letter.state === next.letter.state &&
    prev.letter.char === next.letter.char &&
    prev.letter.cipherChar === next.letter.cipherChar
)
