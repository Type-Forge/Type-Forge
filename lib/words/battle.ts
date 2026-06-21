import { WORDS } from "./word-pool";
import { EASY_INDICES } from "./easy";
import { MEDIUM_INDICES } from "./medium";
import { HARD_INDICES } from "./hard";
import { isAllowedWord, EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, CORE_COMMON_WORDS } from "../words";
import { useSettingsStore } from "../../stores/settings-store";

export interface BattleDifficultyConfig {
  wordComplexity: "easy" | "medium" | "hard";
  punctuationChance: number;
  rareWordChance: number;
}

export const BATTLE_DIFFICULTY_PRESETS: Record<"easy" | "medium" | "hard" | "veryhard", BattleDifficultyConfig> = {
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
  veryhard: {
    wordComplexity: "hard",
    punctuationChance: 0.25, // 25% chance of punctuation
    rareWordChance: 0.3,
  },
};

const PUNCTUATIONS = [".", ",", ";", ":", "?"];

/**
 * Returns N random words for a Battle session based on settings difficulty and battle configs
 */
export function getBattleWords(count: number, difficulty: "easy" | "medium" | "hard" | "veryhard"): string[] {
  const config = BATTLE_DIFFICULTY_PRESETS[difficulty] || BATTLE_DIFFICULTY_PRESETS.medium;
  const globalDifficulty = useSettingsStore.getState().difficulty;

  let basePool = HARD_WORDS;
  if (globalDifficulty === "easy") {
    basePool = EASY_WORDS;
  } else if (globalDifficulty === "medium") {
    basePool = MEDIUM_WORDS;
  }

  const words: string[] = [];

  for (let i = 0; i < count; i++) {
    // 20% chance to pick a core common word, to keep standard flow
    const useCommonBoost = Math.random() < 0.20;
    let word = "";
    if (useCommonBoost) {
      word = CORE_COMMON_WORDS[Math.floor(Math.random() * CORE_COMMON_WORDS.length)];
    } else {
      word = basePool[Math.floor(Math.random() * basePool.length)];
    }
    
    let attempts = 0;
    while (!isAllowedWord(word) && attempts < 15) {
      if (useCommonBoost) {
        word = CORE_COMMON_WORDS[Math.floor(Math.random() * CORE_COMMON_WORDS.length)];
      } else {
        word = basePool[Math.floor(Math.random() * basePool.length)];
      }
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

