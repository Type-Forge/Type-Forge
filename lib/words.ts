import { WORDS } from "./words/word-pool";
import { EASY_INDICES } from "./words/easy";
import { MEDIUM_INDICES } from "./words/medium";
import { HARD_INDICES } from "./words/hard";
import { useSettingsStore } from "../stores/settings-store";

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
  "asshole", "assholes", "pissed", "pisses", "balls", "butt", "boob", "boobs", "tit", "tits", "sexes", "sexual",
  "sexy", "blowjob", "gays"
]);

export const EASY_WORDS = WORDS.slice(0, 1000);
export const MEDIUM_WORDS = WORDS.slice(0, 5000);
export const HARD_WORDS = WORDS;

export const CORE_COMMON_WORDS = [
  "the", "with", "fact", "make", "up", "we", "over", "as", "face", "and", "of", "to", "in", "for", "is", "on", "that", "by", "this", "you", "it", "not", "or", "be", "are", "from", "at", "your", "all", "have", "new", "more", "an", "was", "will", "home", "can", "us", "about", "if", "page", "my", "has", "but", "our", "one", "other", "do", "no", "time", "they", "he", "what", "which", "their", "news", "out", "use", "any", "there", "see", "only", "so", "his", "when", "here", "who", "also", "now", "help", "get", "view", "first", "been", "would", "how", "were", "me", "some", "these", "like", "than", "find", "back", "people", "had", "just", "state", "year", "day", "into", "two", "world", "next", "go", "work", "last", "most", "them", "should", "good", "well", "where", "after", "best", "then", "know", "take", "come"
];

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
 * Pick N random words from the active difficulty vocabulary pool, boosted by core common words.
 */
export function getRandomWords(count: number, difficulty?: "easy" | "medium" | "hard" | "custom"): string[] {
  // Use settings difficulty if not explicitly passed
  const activeDifficulty = difficulty && difficulty !== "custom"
    ? difficulty
    : useSettingsStore.getState().difficulty;

  let pool = HARD_WORDS;
  if (activeDifficulty === "easy") {
    pool = EASY_WORDS;
  } else if (activeDifficulty === "medium") {
    pool = MEDIUM_WORDS;
  }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    // 25% chance to pick a core common word, to ensure baseline vocabulary is typed
    const useCommonBoost = Math.random() < 0.25;
    let word = "";
    if (useCommonBoost) {
      word = CORE_COMMON_WORDS[Math.floor(Math.random() * CORE_COMMON_WORDS.length)];
    } else {
      word = pool[Math.floor(Math.random() * pool.length)];
    }
    
    let attempts = 0;
    while (!isAllowedWord(word) && attempts < 15) {
      if (useCommonBoost) {
        word = CORE_COMMON_WORDS[Math.floor(Math.random() * CORE_COMMON_WORDS.length)];
      } else {
        word = pool[Math.floor(Math.random() * pool.length)];
      }
      attempts++;
    }
    if (!isAllowedWord(word)) {
      word = "the"; // Safe fallback
    }
    result.push(word);
  }

  return result;
}

