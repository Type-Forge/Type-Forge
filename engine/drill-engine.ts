import { WORD_BANK } from "@/lib/words"
import type { KeyStats, BigramStats, TrigramStats, MistakeRecord } from "@/types"

/**
 * Calculates a weakness score (0-100) for a single key.
 * weakness = accuracyPenalty * 0.6 + speedPenalty * 0.4
 * Damped by a confidence multiplier if attempts are low.
 */
export function calculateKeyWeakness(stats: KeyStats): number {
  if (stats.totalAttempts === 0) return 0

  const accuracy = stats.totalCorrect / stats.totalAttempts
  const accuracyPenalty = (1 - accuracy) * 100

  // Standard reaction time is around 180ms. Above 400ms is heavy speed penalty.
  const speedPenalty = Math.min(100, Math.max(0, (stats.averageReactionTime - 150) / 2.5))

  const score = accuracyPenalty * 0.6 + speedPenalty * 0.4
  const confidence = Math.min(1.0, stats.totalAttempts / 5)

  return Math.round(score * confidence)
}

/**
 * Calculates a weakness score (0-100) for a bigram.
 */
export function calculateBigramWeakness(stats: BigramStats): number {
  if (stats.attempts === 0) return 0

  const accuracy = (stats.attempts - stats.mistakes) / stats.attempts
  const accuracyPenalty = (1 - accuracy) * 100

  // Bigram transition is typically around 200ms. Above 500ms gets high penalty.
  const speedPenalty = Math.min(100, Math.max(0, (stats.averageTransitionTime - 200) / 3.0))

  const score = accuracyPenalty * 0.6 + speedPenalty * 0.4
  const confidence = Math.min(1.0, stats.attempts / 4)

  return Math.round(score * confidence)
}

/**
 * Calculates a weakness score (0-100) for a trigram.
 */
export function calculateTrigramWeakness(stats: TrigramStats): number {
  if (stats.attempts === 0) return 0

  const accuracy = (stats.attempts - stats.mistakes) / stats.attempts
  const accuracyPenalty = (1 - accuracy) * 100

  const speedPenalty = Math.min(100, Math.max(0, (stats.averageTransitionTime - 350) / 4.0))

  const score = accuracyPenalty * 0.6 + speedPenalty * 0.4
  const confidence = Math.min(1.0, stats.attempts / 3)

  return Math.round(score * confidence)
}

/**
 * Returns a weakness ratio (0.40 to 0.85) based on the user's average weakness score.
 * Strong user -> 60% weak keys (0.60 ratio), Weak user -> 85% weak keys (0.85 ratio)
 */
export function getWeaknessRatio(averageWeakness: number): number {
  const ratio = 0.60 + (averageWeakness / 100) * 0.25
  return Math.min(0.85, Math.max(0.40, ratio))
}

/**
 * Helper to check if a word contains any focus key or bigram.
 */
export function matchesFocus(word: string, focusKeys: string[], focusBigrams: string[]): boolean {
  const lowercaseWord = word.toLowerCase()
  for (const bigram of focusBigrams) {
    if (lowercaseWord.includes(bigram.toLowerCase())) {
      return true
    }
  }
  for (const key of focusKeys) {
    if (lowercaseWord.includes(key.toLowerCase())) {
      return true
    }
  }
  return false
}

/**
 * Generates dynamic drill words based on focus targets and difficulty.
 */
export function generateDrillText(options: {
  difficulty: "easy" | "medium" | "hard" | "custom"
  focusKeys: string[]
  focusBigrams: string[]
  weaknessRatio: number
  wordCount?: number
}): string[] {
  const count = options.wordCount ?? 25
  const focusKeys = options.focusKeys.map(k => k.toLowerCase())
  const focusBigrams = options.focusBigrams.map(b => b.toLowerCase())

  // Separate Word Bank into focus matches and normal words
  const focusWords = WORD_BANK.filter(w => matchesFocus(w, focusKeys, focusBigrams))
  const normalWords = WORD_BANK.filter(w => !matchesFocus(w, focusKeys, focusBigrams))

  const words: string[] = []

  // If focus targets are empty, generate normal words
  if (focusKeys.length === 0 && focusBigrams.length === 0) {
    for (let i = 0; i < count; i++) {
      words.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)])
    }
    return words
  }

  // Easy mode: repeated character drills and short targeted words
  if (options.difficulty === "easy") {
    for (let i = 0; i < count; i++) {
      const isFocus = Math.random() < options.weaknessRatio
      if (isFocus && focusKeys.length > 0) {
        // Generate a repeated letter sequence or target word
        const key = focusKeys[Math.floor(Math.random() * focusKeys.length)]
        if (Math.random() < 0.6) {
          // Repeated pattern e.g., "jjjj", "fjfj"
          const len = 3 + Math.floor(Math.random() * 3)
          if (Math.random() < 0.5) {
            words.push(key.repeat(len))
          } else {
            const alternateKey = focusKeys[(focusKeys.indexOf(key) + 1) % focusKeys.length] || "f"
            words.push(Array.from({ length: len }, (_, idx) => idx % 2 === 0 ? key : alternateKey).join(""))
          }
        } else if (focusWords.length > 0) {
          words.push(focusWords[Math.floor(Math.random() * focusWords.length)])
        } else {
          words.push(key.repeat(4))
        }
      } else {
        const source = normalWords.length > 0 ? normalWords : WORD_BANK
        words.push(source[Math.floor(Math.random() * source.length)])
      }
    }
    return words
  }

  // Medium / Custom modes: word-level integration
  if (options.difficulty === "medium" || options.difficulty === "custom") {
    for (let i = 0; i < count; i++) {
      const isFocus = Math.random() < options.weaknessRatio
      if (isFocus && (focusWords.length > 0 || focusKeys.length > 0)) {
        if (focusWords.length > 0) {
          words.push(focusWords[Math.floor(Math.random() * focusWords.length)])
        } else {
          // Fallback if no matching dictionary words: create pseudoword patterns
          const key = focusKeys[Math.floor(Math.random() * focusKeys.length)]
          words.push(`${key}a${key}e`)
        }
      } else {
        const source = normalWords.length > 0 ? normalWords : WORD_BANK
        words.push(source[Math.floor(Math.random() * source.length)])
      }
    }
    return words
  }

  // Hard mode: phrases/sentences with high density of target keys/transitions
  // Construct sentence structures of 4-6 words each
  const sentenceConnectors = ["the", "and", "is", "for", "with", "that", "this", "their", "your", "to", "in"]
  while (words.length < count) {
    const sentenceLength = 4 + Math.floor(Math.random() * 3)
    const sentenceWords: string[] = []

    for (let j = 0; j < sentenceLength; j++) {
      const isFocus = Math.random() < options.weaknessRatio
      if (isFocus && focusWords.length > 0) {
        sentenceWords.push(focusWords[Math.floor(Math.random() * focusWords.length)])
      } else if (Math.random() < 0.3) {
        sentenceWords.push(sentenceConnectors[Math.floor(Math.random() * sentenceConnectors.length)])
      } else {
        const source = normalWords.length > 0 ? normalWords : WORD_BANK
        sentenceWords.push(source[Math.floor(Math.random() * source.length)])
      }
    }

    words.push(...sentenceWords)
  }

  return words.slice(0, count)
}

/**
 * Returns dynamic suggestions for drills based on the current stats.
 */
export interface SuggestedDrill {
  id: string
  title: string
  description: string
  focusKeys: string[]
  focusBigrams: string[]
  difficulty: "easy" | "medium" | "hard"
}

export function getSuggestedDrills(
  keyStats: Record<string, KeyStats>,
  bigramStats: Record<string, BigramStats>,
  mistakeRecords: MistakeRecord[]
): SuggestedDrill[] {
  const suggestions: SuggestedDrill[] = []

  // 1. Analyze Mistake records for swap patterns
  // Group mistake records by expected keys
  const swapCounts: Record<string, { count: number; actuals: Record<string, number> }> = {}
  mistakeRecords.forEach(m => {
    if (m.expected.length >= 2) {
      if (!swapCounts[m.expected]) {
        swapCounts[m.expected] = { count: 0, actuals: {} }
      }
      swapCounts[m.expected].count++
      swapCounts[m.expected].actuals[m.actual] = (swapCounts[m.expected].actuals[m.actual] || 0) + 1
    }
  })

  // Find most frequent swap
  let topSwapExpected = ""
  let topSwapActual = ""
  let maxSwapCount = 0

  Object.entries(swapCounts).forEach(([expected, data]) => {
    if (data.count > maxSwapCount) {
      maxSwapCount = data.count
      topSwapExpected = expected
      // Find the most frequent actual typo for this expected string
      let maxActVal = 0
      Object.entries(data.actuals).forEach(([act, val]) => {
        if (val > maxActVal) {
          maxActVal = val
          topSwapActual = act
        }
      })
    }
  })

  if (maxSwapCount >= 2 && topSwapExpected && topSwapActual) {
    suggestions.push({
      id: `swap-${topSwapExpected}`,
      title: `Swap Fix: ${topSwapExpected.toUpperCase()} vs ${topSwapActual.toUpperCase()}`,
      description: `You swap '${topSwapExpected}' as '${topSwapActual}' frequently. Retrain these character patterns.`,
      focusKeys: topSwapExpected.split(""),
      focusBigrams: [topSwapExpected],
      difficulty: "medium",
    })
  }

  // 2. Extract weak keys
  const weakKeys = Object.values(keyStats)
    .map(stats => ({ stats, weakness: calculateKeyWeakness(stats) }))
    .filter(item => item.weakness > 15)
    .sort((a, b) => b.weakness - a.weakness)

  if (weakKeys.length > 0) {
    const worstKey = weakKeys[0].stats.key
    const worstAccuracy = Math.round((weakKeys[0].stats.totalCorrect / weakKeys[0].stats.totalAttempts) * 100)
    suggestions.push({
      id: `key-accuracy-${worstKey}`,
      title: `Precision: Key ${worstKey.toUpperCase()}`,
      description: `Your accuracy on '${worstKey.toUpperCase()}' is only ${worstAccuracy}%. Slow down and train muscle precision.`,
      focusKeys: [worstKey],
      focusBigrams: [],
      difficulty: "easy",
    })
  }

  // 3. Extract weak bigrams
  const weakBigrams = Object.values(bigramStats)
    .map(stats => ({ stats, weakness: calculateBigramWeakness(stats) }))
    .filter(item => item.weakness > 15)
    .sort((a, b) => b.weakness - a.weakness)

  if (weakBigrams.length > 0) {
    const worstBigram = weakBigrams[0].stats.pair
    suggestions.push({
      id: `bigram-${worstBigram}`,
      title: `Transition: ${worstBigram.toUpperCase()}`,
      description: `Transitions for '${worstBigram.toUpperCase()}' are slow or error-prone. Train smooth hand transitions.`,
      focusKeys: [],
      focusBigrams: [worstBigram],
      difficulty: "medium",
    })
  }

  // 4. Fallback if no specific weak stats exist yet
  if (suggestions.length === 0) {
    suggestions.push({
      id: "suggested-default-th",
      title: "Transition: TH & HE",
      description: "Practice the most common English transitions: 'th' and 'he'.",
      focusKeys: ["t", "h", "e"],
      focusBigrams: ["th", "he"],
      difficulty: "easy",
    })
    suggestions.push({
      id: "suggested-default-in",
      title: "Suffix Drill: ING",
      description: "Focus on suffix flows like 'in', 'ng', and 'ing'.",
      focusKeys: ["i", "n", "g"],
      focusBigrams: ["in", "ng"],
      difficulty: "medium",
    })
  }

  return suggestions.slice(0, 3)
}
