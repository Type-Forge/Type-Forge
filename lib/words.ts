import { WORDS } from "./words/word-pool";
import { EASY_INDICES } from "./words/easy";
import { MEDIUM_INDICES } from "./words/medium";
import { HARD_INDICES } from "./words/hard";

export const ALLOWED_2_LETTER_WORDS = new Set([
  "am", "an", "as", "at", "be", "by", "do", "go", "he", "hi", "if", "in", "is",
  "it", "me", "my", "no", "of", "oh", "ok", "on", "or", "so", "to", "up", "us", "we"
]);

export const BANNED_WORDS = new Set([
  "sex", "fuck", "bitch", "shit", "ass", "cunt", "cock", "dick", "pussy", "porn",
  "whore", "bastard", "slut", "crap", "damn", "piss", "gay", "lesbian", "sexi",
  "naked", "erotic", "nude", "orgasm", "clitoris", "semen", "sperm", "vagina",
  "penis", "anal", "rape", "weed", "cocaine", "heroin", "faggot", "nigger", "kike",
  "dyke", "retard", "bastards", "bitches", "fucks", "fucking", "fucked", "shits", "shitting",
  "asshole", "assholes", "pissed", "pisses", "balls", "butt", "boob", "boobs", "tit", "tits", "sexes", "sexual"
]);

/**
 * Returns true if the word is not in the profanity list
 * and is either longer than 2 characters or is a valid common 2-letter word.
 */
export function isAllowedWord(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "").trim();
  
  if (BANNED_WORDS.has(cleanWord)) {
    return false;
  }
  
  if (cleanWord.length === 2 && !ALLOWED_2_LETTER_WORDS.has(cleanWord)) {
    return false;
  }
  
  if (cleanWord.length === 1 && cleanWord !== "a" && cleanWord !== "i") {
    return false;
  }
  
  return true;
}

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
    let randIndex = poolIndices[Math.floor(Math.random() * poolIndices.length)];
    let word = WORDS[randIndex] || "the";
    let attempts = 0;
    while (!isAllowedWord(word) && attempts < 15) {
      randIndex = poolIndices[Math.floor(Math.random() * poolIndices.length)];
      word = WORDS[randIndex] || "the";
      attempts++;
    }
    if (!isAllowedWord(word)) {
      word = "the"; // Safe fallback
    }
    result.push(word);
  }

  return result;
}

