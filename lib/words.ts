import { WORDS } from "./words/word-pool";
import { EASY_INDICES } from "./words/easy";
import { MEDIUM_INDICES } from "./words/medium";
import { HARD_INDICES } from "./words/hard";

/**
 * Clean exported WORD_BANK for backwards compatibility
 */
export const WORD_BANK = WORDS;

/**
 * Pick N random words from the expanded word bank, filtered optionally by difficulty.
 */
export function getRandomWords(count: number, difficulty?: "easy" | "medium" | "hard" | "custom"): string[] {
  let poolIndices: number[] = [];

  if (difficulty === "easy") {
    poolIndices = EASY_INDICES;
  } else if (difficulty === "medium") {
    poolIndices = MEDIUM_INDICES;
  } else if (difficulty === "hard") {
    poolIndices = HARD_INDICES;
  } else {
    // Blended default pool (Easy + Medium words) to provide standard balanced typing experience
    poolIndices = [...EASY_INDICES, ...MEDIUM_INDICES];
  }

  if (poolIndices.length === 0) {
    poolIndices = Array.from({ length: WORDS.length }, (_, i) => i);
  }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const randIndex = poolIndices[Math.floor(Math.random() * poolIndices.length)];
    result.push(WORDS[randIndex] || "the");
  }

  return result;
}
