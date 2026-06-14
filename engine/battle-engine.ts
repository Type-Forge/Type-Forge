import type { BattleDifficulty } from "@/types"
import { AI_WPM_MAP } from "@/lib/constants"

/**
 * Calculate AI progress per tick.
 *
 * @param difficulty - easy | medium | hard
 * @param totalWords - total words in the race
 * @param tickMs - how often this is called (e.g., 100ms)
 * @returns progress increment (0 to 1 scale)
 */
export function calculateAiProgressPerTick(
  difficulty: BattleDifficulty,
  totalWords: number,
  tickMs: number
): number {
  const wpm = AI_WPM_MAP[difficulty]
  
  // Characters per ms = (wpm * 5 characters per word) / 60,000 ms per minute
  const charsPerMs = (wpm * 5) / 60000
  const charsPerTick = charsPerMs * tickMs
  const wordsPerTick = charsPerTick / 5
  const progressPerTick = wordsPerTick / totalWords
  
  // Add slight randomness to make the AI typing feel human
  const randomness = 0.95 + Math.random() * 0.1
  return progressPerTick * randomness
}

/**
 * Calculate player progress.
 * @param completedWords - number of words the player has completed
 * @param totalWords - total words in the race
 * @returns progress 0 to 1
 */
export function calculatePlayerProgress(
  completedWords: number,
  totalWords: number
): number {
  if (totalWords <= 0) return 0
  return Math.min(completedWords / totalWords, 1)
}
