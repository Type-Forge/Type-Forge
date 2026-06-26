import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, CORE_COMMON_WORDS, isAllowedWord } from "../words"

/**
 * Returns N identical words based on seed and difficulty.
 * Guaranteed to return the same words on both clients for a given seed.
 */
export function getSeededBattleWords(
  count: number,
  difficulty: "easy" | "medium" | "hard" | "veryhard",
  seedStr: string
): string[] {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) | 0
  }

  // Deterministic seeded random number generator (Sine PRNG)
  function random() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  let pool = HARD_WORDS
  if (difficulty === "easy") {
    pool = EASY_WORDS
  } else if (difficulty === "medium") {
    pool = MEDIUM_WORDS
  }

  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const useCommonBoost = random() < 0.25
    let word = ""
    if (useCommonBoost) {
      const idx = Math.floor(random() * CORE_COMMON_WORDS.length)
      word = CORE_COMMON_WORDS[idx]
    } else {
      const idx = Math.floor(random() * pool.length)
      word = pool[idx]
    }

    let attempts = 0
    while (!isAllowedWord(word) && attempts < 15) {
      if (useCommonBoost) {
        const idx = Math.floor(random() * CORE_COMMON_WORDS.length)
        word = CORE_COMMON_WORDS[idx]
      } else {
        const idx = Math.floor(random() * pool.length)
        word = pool[idx]
      }
      attempts++
    }

    if (!isAllowedWord(word)) {
      word = "the"
    }

    result.push(word)
  }

  return result
}
