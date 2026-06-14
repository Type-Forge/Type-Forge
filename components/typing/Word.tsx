"use client"

import { memo } from "react"
import { Letter } from "./Letter"
import type { WordData } from "@/types"

interface WordProps {
  word: WordData
  isCurrent: boolean
}

/**
 * Word component rendering normal letter spans followed by extra typed letters.
 * Memorized to only trigger updates when letters or word state transitions.
 */
export const Word = memo(
  function Word({ word, isCurrent }: WordProps) {
    const isIncorrectAndCompleted = word.state === "incorrect"

    return (
      <span
        data-word-index={word.index}
        className={`inline-block relative py-0.5 mx-1 transition-all duration-200 ${
          isIncorrectAndCompleted
            ? "border-b-2 border-incorrect/80 border-dashed"
            : ""
        }`}
      >
        {/* Render standard letters */}
        {word.letters.map((letter, idx) => (
          <Letter
            key={`${word.index}-L-${idx}`}
            letter={letter}
            wordIndex={word.index}
            letterIndex={idx}
          />
        ))}

        {/* Render extra letters */}
        {word.extras.map((extraLetter, idx) => (
          <Letter
            key={`${word.index}-E-${idx}`}
            letter={extraLetter}
            wordIndex={word.index}
            letterIndex={word.letters.length + idx}
          />
        ))}
      </span>
    )
  },
  (prev, next) =>
    prev.isCurrent === next.isCurrent &&
    prev.word.state === next.word.state &&
    prev.word.letters === next.word.letters &&
    prev.word.extras === next.word.extras
)
