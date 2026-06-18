import { WORDS } from "@/lib/words/word-pool"
import { getIndicesForTarget, getGeneralIndices } from "@/lib/words/drill"
import type { KeyStats, BigramStats, TrigramStats, MistakeRecord } from "@/types"
import { isAllowedWord } from "@/lib/words"


/**
 * Calculates a weakness score (0-100) for a single key.
 * 40% Accuracy, 30% Reaction Time, 20% Miss Frequency, 10% Consecutive Errors
 */
export function calculateKeyWeakness(stats: KeyStats, totalIncorrectAllKeys: number = 0): number {
  if (stats.totalAttempts === 0) return 0

  // 1. Accuracy Penalty (40%)
  const accuracy = stats.totalAttempts > 0 ? stats.totalCorrect / stats.totalAttempts : 1.0
  const accuracyPenalty = (1 - accuracy) * 100

  // 2. Reaction Time Penalty (30%)
  // Standard reaction is 150ms. Max penalty of 100 for reaction time >= 450ms
  const speedPenalty = Math.min(100, Math.max(0, (stats.averageReactionTime - 150) / 3.0))

  // 3. Miss Frequency Penalty (20%)
  // Proportion of errors on this key compared to total session errors
  const missFrequency = totalIncorrectAllKeys > 0
    ? (stats.totalIncorrect / totalIncorrectAllKeys) * 100
    : Math.min(100, stats.totalIncorrect * 10) // fallback to absolute scaling if total is 0

  // 4. Consecutive Errors Penalty (10%)
  // Scaled max consecutive mistakes (e.g. 1 error = 25 penalty, 4+ errors = 100 penalty)
  const consecutivePenalty = Math.min(100, (stats.maxConsecutiveMistakes || 0) * 25)

  const score = (accuracyPenalty * 0.4) + (speedPenalty * 0.3) + (missFrequency * 0.2) + (consecutivePenalty * 0.1)
  
  // Damped by confidence multiplier if attempts are low (confidence is 1.0 at 5+ attempts)
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
    if (lowercaseWord.includes(bigram.toLowerCase())) return true
  }
  for (const key of focusKeys) {
    if (lowercaseWord.includes(key.toLowerCase())) return true
  }
  return false
}

/**
 * Generates dynamic drill words based on focus targets and difficulty.
 * Uses O(1) indexed references, normalized weakness weighting, and natural ratios.
 */
export function generateDrillText(options: {
  difficulty: "easy" | "medium" | "hard" | "custom"
  focusKeys: string[]
  focusBigrams: string[]
  weaknessRatio: number
  wordCount?: number
  keyStats?: Record<string, KeyStats>
  bigramStats?: Record<string, BigramStats>
}): string[] {
  const count = options.wordCount ?? 25
  const focusKeys = options.focusKeys.map(k => k.toLowerCase())
  const focusBigrams = options.focusBigrams.map(b => b.toLowerCase())
  const targets = [...focusKeys, ...focusBigrams]

  // If focus targets are empty, generate normal words matching difficulty
  if (targets.length === 0) {
    const generalIndices = getGeneralIndices(options.difficulty)
    const result: string[] = []
    for (let i = 0; i < count; i++) {
      const idx = generalIndices[Math.floor(Math.random() * generalIndices.length)]
      result.push(WORDS[idx] || "the")
    }
    return result
  }

  // 1. Determine Natural Drill Ratios (Target vs Normal distribution)
  // If targets are specified, force targetRatio to 1.0 so only words containing selected targets are served.
  const targetRatio = targets.length > 0 ? 1.0 : 0.0

  // 2. Compute Weakness-Weighted Target Probabilities
  const targetWeights: Record<string, number> = {}
  const totalIncorrectAllKeys = options.keyStats
    ? Object.values(options.keyStats).reduce((sum, s) => sum + s.totalIncorrect, 0)
    : 0

  targets.forEach((t) => {
    let w = 10 // baseline weight
    if (t.length === 1 && options.keyStats && options.keyStats[t]) {
      w = Math.max(10, calculateKeyWeakness(options.keyStats[t], totalIncorrectAllKeys))
    } else if (t.length === 2 && options.bigramStats && options.bigramStats[t]) {
      w = Math.max(10, calculateBigramWeakness(options.bigramStats[t]))
    }
    targetWeights[t] = w
  })

  const totalWeight = Object.values(targetWeights).reduce((sum, w) => sum + w, 0)

  // Weighted selection helper
  function pickTarget(): string {
    const r = Math.random() * totalWeight
    let acc = 0
    for (const t of targets) {
      acc += targetWeights[t]
      if (r <= acc) return t
    }
    return targets[0]
  }

  // General vocabulary indices for the current tier
  const generalIndices = getGeneralIndices(options.difficulty)

  const words: string[] = []
  for (let i = 0; i < count; i++) {
    const isTarget = Math.random() < targetRatio
    let word = "the"
    let attempts = 0

    while (attempts < 15) {
      if (isTarget) {
        const selectedTarget = pickTarget()
        const indices = getIndicesForTarget(selectedTarget, options.difficulty)

        if (indices.length > 0) {
          const randIndex = indices[Math.floor(Math.random() * indices.length)]
          word = WORDS[randIndex] || "the"
        } else {
          // Fallback to general vocabulary word if no exact target match exists in this tier
          const randIndex = generalIndices[Math.floor(Math.random() * generalIndices.length)]
          word = WORDS[randIndex] || "the"
        }
      } else {
        // Natural mix word from general vocabulary
        const randIndex = generalIndices[Math.floor(Math.random() * generalIndices.length)]
        word = WORDS[randIndex] || "the"
      }

      if (isAllowedWord(word)) {
        break
      }
      attempts++
    }

    if (!isAllowedWord(word)) {
      // Find a clean random word as fallback
      let fallbackWord = "the"
      let fallbackAttempts = 0
      while (fallbackAttempts < 10) {
        const idx = generalIndices[Math.floor(Math.random() * generalIndices.length)]
        const cand = WORDS[idx] || "the"
        if (isAllowedWord(cand)) {
          fallbackWord = cand
          break
        }
        fallbackAttempts++
      }
      word = fallbackWord
    }

    words.push(word)
  }

  return words

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

  // Calculate totalIncorrectAllKeys
  const totalIncorrectAllKeys = Object.values(keyStats).reduce((sum, s) => sum + s.totalIncorrect, 0)

  // 2. Extract weak keys
  const weakKeys = Object.values(keyStats)
    .map(stats => ({ stats, weakness: calculateKeyWeakness(stats, totalIncorrectAllKeys) }))
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
      id: "suggested-default-g",
      title: "Transition: G-Flow (NG & GR)",
      description: "Focus on common 'g' letter flows: 'ng' and 'gr'.",
      focusKeys: ["n", "g", "r"],
      focusBigrams: ["ng", "gr"],
      difficulty: "medium",
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
