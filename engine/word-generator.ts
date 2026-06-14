import { getRandomWords } from "@/lib/words"
import { initializeWords } from "./typing-engine"
import type { WordData } from "@/types"

/**
 * Generate a list of words initialized with their cipher equivalents.
 */
export function generateSessionWords(count: number): WordData[] {
  const rawWords = getRandomWords(count)
  return initializeWords(rawWords)
}
