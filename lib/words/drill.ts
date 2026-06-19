import { WORDS } from "./word-pool";
import { LETTER_INDEX } from "./indexes/letter-index";
import { BIGRAM_INDEX } from "./indexes/bigram-index";
import { TRIGRAM_INDEX } from "./indexes/trigram-index";
import { EASY_INDICES } from "./easy";
import { MEDIUM_INDICES } from "./medium";
import { HARD_INDICES } from "./hard";

// Difficulty Ranges matching build-time segmentation
export const EASY_MAX_INDEX = 1136;
export const MEDIUM_MAX_INDEX = 4771; // 1136 + 3635

/**
 * Checks if a word index falls within a specific difficulty tier
 */
export function isIndexInDifficulty(index: number, difficulty: "easy" | "medium" | "hard" | "custom"): boolean {
  if (difficulty === "easy") {
    return index < EASY_MAX_INDEX;
  }
  if (difficulty === "medium") {
    return index >= EASY_MAX_INDEX && index < MEDIUM_MAX_INDEX;
  }
  if (difficulty === "hard") {
    return index >= MEDIUM_MAX_INDEX;
  }
  return true; // "custom" or any other tier allows any index
}

/**
 * Returns a list of word indices matching a given target string (letter, bigram, or trigram)
 * filtered optionally by difficulty. Runs in O(1) index map lookup.
 */
export function getIndicesForTarget(target: string, difficulty: "easy" | "medium" | "hard" | "custom" = "custom"): number[] {
  const clean = target.toLowerCase();
  let indices: number[] = [];

  if (clean.length === 1) {
    indices = LETTER_INDEX[clean] || [];
  } else if (clean.length === 2) {
    indices = BIGRAM_INDEX[clean] || [];
  } else if (clean.length === 3) {
    indices = TRIGRAM_INDEX[clean] || [];
  }

  if (indices.length === 0) return [];

  // Filter indices by difficulty tier range
  const filtered = indices.filter(idx => isIndexInDifficulty(idx, difficulty));
  
  // Fallback: if no words matching the target exist in the specific tier, return all matched indices
  return filtered.length > 0 ? filtered : indices;
}

/**
 * Generates an index pool of general vocabulary words matching a difficulty tier
 */
export function getGeneralIndices(difficulty: "easy" | "medium" | "hard" | "custom"): number[] {
  if (difficulty === "easy") return EASY_INDICES;
  if (difficulty === "medium") return MEDIUM_INDICES;
  if (difficulty === "hard") return HARD_INDICES;
  return Array.from({ length: WORDS.length }, (_, i) => i);
}

/**
 * Generates endless words containing the active focus letter for YOLO mode.
 * V1: Just pick random words containing activeLetter from index. Filter profanity.
 */
export function generateYoloWords(activeLetter: string, count: number = 20): string[] {
  const clean = activeLetter.toLowerCase();
  const indices = getIndicesForTarget(clean, "custom");
  const { isAllowedWord } = require("../words"); // avoid circular dependency, resolve dynamically

  if (indices.length === 0) {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * WORDS.length);
      const w = WORDS[idx] || "the";
      result.push(w);
    }
    return result;
  }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let word = "the";
    while (attempts < 15) {
      const randIndex = indices[Math.floor(Math.random() * indices.length)];
      const cand = WORDS[randIndex] || "the";
      if (isAllowedWord(cand)) {
        word = cand;
        break;
      }
      attempts++;
    }
    result.push(word);
  }
  return result;
}
