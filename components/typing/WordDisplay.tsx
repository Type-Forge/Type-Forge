"use client"

import { Word } from "./Word"
import type { WordData } from "@/types"

interface WordDisplayProps {
  words: WordData[]
  currentWordIndex: number
}

/**
 * Flex layout grid displaying all Word components.
 * Propagates current active index variables for visual selection.
 */
export default function WordDisplay({ words, currentWordIndex }: WordDisplayProps) {
  return (
    <div className="flex flex-wrap justify-start gap-y-[0.4em] select-none w-full">
      {words.map((word) => (
        <Word
          key={`word-${word.index}`}
          word={word}
          isCurrent={word.index === currentWordIndex}
        />
      ))}
    </div>
  )
}
