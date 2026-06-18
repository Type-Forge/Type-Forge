import { WORDS } from "./word-pool";
import { EASY_INDICES } from "./easy";
import { MEDIUM_INDICES } from "./medium";
import { HARD_INDICES } from "./hard";
import { isAllowedWord } from "../words";

export interface BattleDifficultyConfig {
  wordComplexity: "easy" | "medium" | "hard";
  punctuationChance: number;
  rareWordChance: number;
}

export const BATTLE_DIFFICULTY_PRESETS: Record<"easy" | "medium" | "hard", BattleDifficultyConfig> = {
  easy: {
    wordComplexity: "easy",
    punctuationChance: 0.0,
    rareWordChance: 0.05,
  },
  medium: {
    wordComplexity: "medium",
    punctuationChance: 0.05, // 5% chance of attaching simple , or .
    rareWordChance: 0.1,
  },
  hard: {
    wordComplexity: "hard",
    punctuationChance: 0.15, // 15% chance of punctuation (, . : ; ?)
    rareWordChance: 0.2,
  },
};

const PUNCTUATIONS = [".", ",", ";", ":", "?"];

/**
 * Returns N random words for a Battle session based on difficulty configurations
 */
export function getBattleWords(count: number, difficulty: "easy" | "medium" | "hard"): string[] {
  const config = BATTLE_DIFFICULTY_PRESETS[difficulty] || BATTLE_DIFFICULTY_PRESETS.medium;
  const words: string[] = [];

  // Determine main pool and rare pool
  let mainPoolIndices: number[] = [];
  if (config.wordComplexity === "easy") mainPoolIndices = EASY_INDICES;
  else if (config.wordComplexity === "medium") mainPoolIndices = MEDIUM_INDICES;
  else mainPoolIndices = HARD_INDICES;

  const rarePoolIndices = HARD_INDICES; // Hard words serve as the "rare" words in easier modes

  for (let i = 0; i < count; i++) {
    const isRare = Math.random() < config.rareWordChance;
    const pool = isRare && rarePoolIndices.length > 0 ? rarePoolIndices : mainPoolIndices;
    let randIndex = pool[Math.floor(Math.random() * pool.length)];
    let word = WORDS[randIndex] || "the";
    
    let attempts = 0;
    while (!isAllowedWord(word) && attempts < 15) {
      randIndex = pool[Math.floor(Math.random() * pool.length)];
      word = WORDS[randIndex] || "the";
      attempts++;
    }
    if (!isAllowedWord(word)) {
      word = "the";
    }

    // Inject punctuation based on chance
    if (config.punctuationChance > 0 && Math.random() < config.punctuationChance) {
      const p = PUNCTUATIONS[Math.floor(Math.random() * PUNCTUATIONS.length)];
      word = word + p;
    }

    words.push(word);
  }

  return words;
}

