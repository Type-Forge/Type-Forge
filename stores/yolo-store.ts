import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useDrillStore } from "./drill-store"
import { useStatsStore } from "./stats-store"
import type { YoloLetterProfile } from "@/types"

// Touch-typing progression sequence
export const YOLO_SEQUENCE = [
  "e", "t", "a", "o", "i", "n", "s", "h", "r", "d", "l", "c", "u",
  "m", "w", "f", "g", "y", "p", "b", "v", "k", "j", "x", "q", "z"
]

export interface YoloSessionSummary {
  wordsCompleted: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  startTime: number | null
  lettersMasteredThisSession: string[]
}

interface YoloState {
  activeLetter: string | null
  letterProfiles: Record<string, YoloLetterProfile>
  totalWordsCompleted: number
  streak: number
  sessionCount: number
  hasActiveRun: boolean
  sessionSummary: YoloSessionSummary

  // Mastery Toast State
  masteryToast: {
    letter: string
    confidence: number
    nextLetter: string
    isVisible: boolean
  } | null

  // Actions
  initYoloRun: () => void
  startFresh: () => void
  updateActiveLetterStats: (
    keystrokes: { char: string; expectedChar: string; time: number; isCorrect: boolean }[],
    sessionWpm: number
  ) => void
  incrementWordsCompleted: (count: number) => void
  closeMasteryToast: () => void
  finishYoloSession: (wpm: number, accuracy: number, duration: number) => void
}

const initialSummary: YoloSessionSummary = {
  wordsCompleted: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
  startTime: null,
  lettersMasteredThisSession: [],
}

// Helper to find worst-performing key in historical Drill stats
export function getWeakestDrillLetter(): string {
  const drillStore = useDrillStore.getState()
  const totalIncorrectAllKeys = Object.values(drillStore.keyStats).reduce(
    (sum, s) => sum + s.totalIncorrect,
    0
  )

  const keyStatsList = Object.values(drillStore.keyStats)
  if (keyStatsList.length === 0) return "e"

  // Standard weakness formula
  const calculateWeakness = (stats: any) => {
    if (stats.totalAttempts === 0) return 0
    const accuracy = stats.totalCorrect / stats.totalAttempts
    const accuracyPenalty = (1 - accuracy) * 100
    const speedPenalty = Math.min(100, Math.max(0, (stats.averageReactionTime - 150) / 3.0))
    const missFrequency = totalIncorrectAllKeys > 0
      ? (stats.totalIncorrect / totalIncorrectAllKeys) * 100
      : stats.totalIncorrect * 10
    const consecutivePenalty = Math.min(100, (stats.maxConsecutiveMistakes || 0) * 25)
    
    const score = (accuracyPenalty * 0.4) + (speedPenalty * 0.3) + (missFrequency * 0.2) + (consecutivePenalty * 0.1)
    const confidence = Math.min(1.0, stats.totalAttempts / 5)
    return score * confidence
  }

  const sorted = keyStatsList
    .map(stats => ({ letter: stats.key.toLowerCase(), score: calculateWeakness(stats) }))
    .filter(item => /^[a-z]$/.test(item.letter)) // standard lower-case letters
    .sort((a, b) => b.score - a.score)

  if (sorted.length > 0 && sorted[0].score > 15) {
    return sorted[0].letter
  }
  return "e"
}

// Initial default profile record for 26 letters
function createDefaultProfiles(): Record<string, YoloLetterProfile> {
  const profiles: Record<string, YoloLetterProfile> = {}
  YOLO_SEQUENCE.forEach((l) => {
    profiles[l] = {
      letter: l,
      attempts: 0,
      correct: 0,
      avgReactionMs: 0,
      confidence: 0,
    }
  })
  return profiles
}

export const useYoloStore = create<YoloState>()(
  persist(
    (set, get) => ({
      activeLetter: null,
      letterProfiles: {},
      totalWordsCompleted: 0,
      streak: 0,
      sessionCount: 0,
      hasActiveRun: false,
      sessionSummary: initialSummary,
      masteryToast: null,

      initYoloRun: () => {
        let currentActive = get().activeLetter
        let profiles = get().letterProfiles

        // If no profiles exist, initialize them
        if (Object.keys(profiles).length === 0) {
          profiles = createDefaultProfiles()
        }

        // If active letter is null, find weakest or default to 'e'
        if (!currentActive) {
          currentActive = getWeakestDrillLetter()
          // Ensure we don't start on an already mastered letter
          if (profiles[currentActive] && profiles[currentActive].confidence >= 90) {
            // Find first unmastered letter in sequence
            const firstUnmastered = YOLO_SEQUENCE.find(l => profiles[l].confidence < 90)
            currentActive = firstUnmastered || "z"
          }
        }

        set({
          activeLetter: currentActive,
          letterProfiles: profiles,
          hasActiveRun: true,
          sessionSummary: {
            ...initialSummary,
            startTime: Date.now(),
          },
          sessionCount: get().sessionCount + 1,
        })
      },

      startFresh: () => {
        const weakest = getWeakestDrillLetter()
        const defaultProfiles = createDefaultProfiles()
        set({
          activeLetter: weakest,
          letterProfiles: defaultProfiles,
          hasActiveRun: true,
          sessionSummary: {
            ...initialSummary,
            startTime: Date.now(),
          },
        })
      },

      updateActiveLetterStats: (keystrokes, sessionWpm) => {
        const active = get().activeLetter
        if (!active) return

        const profiles = { ...get().letterProfiles }
        if (!profiles[active]) {
          profiles[active] = { letter: active, attempts: 0, correct: 0, avgReactionMs: 0, confidence: 0 }
        }

        // 1. Update active letter stats
        const activeKeystrokes = keystrokes.filter(
          k => k.expectedChar.toLowerCase() === active
        )

        let totalAttempts = profiles[active].attempts
        let totalCorrect = profiles[active].correct
        let totalReaction = profiles[active].avgReactionMs * totalCorrect

        activeKeystrokes.forEach((k, idx) => {
          totalAttempts++
          if (k.isCorrect) {
            totalCorrect++
            // Calculate reaction time since previous keystroke index
            const keyIdx = keystrokes.indexOf(k)
            const prevTime = keyIdx === 0 ? (get().sessionSummary.startTime || Date.now()) : keystrokes[keyIdx - 1].time
            const rt = Math.max(0, k.time - prevTime)
            if (rt < 3000) {
              totalReaction += rt
            }
          }
        })

        profiles[active].attempts = totalAttempts
        profiles[active].correct = totalCorrect
        profiles[active].avgReactionMs = totalCorrect > 0 ? Math.round(totalReaction / totalCorrect) : 0

        // Calculate confidence
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
        const avgWpm = useStatsStore.getState().averageWpm
        const targetWpm = Math.max(30, Math.round(avgWpm > 0 ? avgWpm * 0.9 : 45))
        const speedScore = Math.min(100, Math.max(0, (sessionWpm / targetWpm) * 100))
        
        // V1 Formula: confidence = accuracy * 0.7 + speedScore * 0.3
        const finalConfidence = Math.round(accuracy * 0.7 + speedScore * 0.3)
        profiles[active].confidence = Math.min(100, Math.max(0, finalConfidence))

        // 2. Process mistakes on OTHER mastered letters
        const otherExpected = new Set(keystrokes.map(k => k.expectedChar.toLowerCase()))
        otherExpected.delete(active)

        otherExpected.forEach((char) => {
          if (!char || char.length !== 1 || !/^[a-z]$/.test(char)) return
          
          const profile = profiles[char]
          if (profile && profile.confidence >= 90) {
            const charKeystrokes = keystrokes.filter(k => k.expectedChar.toLowerCase() === char)
            const mistakes = charKeystrokes.filter(k => !k.isCorrect).length
            
            if (mistakes > 0) {
              // V1: mastered is mastered, but we slightly damp confidence to track typos,
              // cap minimum at 90 so it stays unlocked, or drop below 90 to re-lock if they fail?
              // The user said: "reinforcement V1 se nikaal do, mastered = mastered. active = active."
              // So for V1, we DO NOT decrease confidence below 90. Capped at 90.
              const newConfidence = Math.max(90, profile.confidence - (mistakes * 2))
              profile.confidence = newConfidence
            } else if (charKeystrokes.length > 0) {
              profile.confidence = Math.min(100, profile.confidence + 1)
            }
          }
        })

        // 3. Switch focus letter if mastered
        let newActive = active
        let toast = null

        if (profiles[active].confidence >= 90 && totalAttempts >= 30) {
          // Find next letter in the touch-typing progression sequence
          const currentIndex = YOLO_SEQUENCE.indexOf(active)
          const nextIndex = currentIndex + 1
          if (nextIndex < YOLO_SEQUENCE.length) {
            newActive = YOLO_SEQUENCE[nextIndex]
            
            // Check if next letter already has a mastered confidence, skip it if so
            while (nextIndex < YOLO_SEQUENCE.length && profiles[newActive] && profiles[newActive].confidence >= 90) {
              const nextLetterIdx = YOLO_SEQUENCE.indexOf(newActive) + 1
              if (nextLetterIdx < YOLO_SEQUENCE.length) {
                newActive = YOLO_SEQUENCE[nextLetterIdx]
              } else {
                break
              }
            }

            // Create toast summary
            toast = {
              letter: active.toUpperCase(),
              confidence: profiles[active].confidence,
              nextLetter: newActive.toUpperCase(),
              isVisible: true,
            }

            // Record letters mastered in summary
            const currentMastered = get().sessionSummary.lettersMasteredThisSession
            if (!currentMastered.includes(active)) {
              set((s) => ({
                sessionSummary: {
                  ...s.sessionSummary,
                  lettersMasteredThisSession: [...currentMastered, active]
                }
              }))
            }
          }
        }

        set({
          letterProfiles: profiles,
          activeLetter: newActive,
          masteryToast: toast,
        })
      },

      incrementWordsCompleted: (count) => {
        set((s) => ({
          totalWordsCompleted: s.totalWordsCompleted + count,
          sessionSummary: {
            ...s.sessionSummary,
            wordsCompleted: s.sessionSummary.wordsCompleted + count,
          },
        }))
      },

      closeMasteryToast: () => {
        set({ masteryToast: null })
      },

      finishYoloSession: (wpm, accuracy, duration) => {
        const summary = get().sessionSummary
        
        // Add session results to Stats Store
        useStatsStore.getState().addResult({
          id: `yolo-${Date.now()}`,
          timestamp: Date.now(),
          config: { mode: "yolo" },
          wpm,
          accuracy,
          totalKeystrokes: summary.correctKeystrokes + summary.incorrectKeystrokes,
          correctKeystrokes: summary.correctKeystrokes,
          incorrectKeystrokes: summary.incorrectKeystrokes,
          duration,
          wordsCompleted: summary.wordsCompleted,
        })

        set({
          hasActiveRun: false,
        })
      },
    }),
    {
      name: "turing-type-yolo",
      // Only persist core data structures to avoid bloat
      partialize: (state) => ({
        activeLetter: state.activeLetter,
        letterProfiles: state.letterProfiles,
        totalWordsCompleted: state.totalWordsCompleted,
        sessionCount: state.sessionCount,
        hasActiveRun: state.hasActiveRun,
      }),
    }
  )
)
