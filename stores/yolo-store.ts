import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useDrillStore } from "./drill-store"
import { useStatsStore } from "./stats-store"
import { useTypingStore } from "./typing-store"
import { useSettingsStore } from "./settings-store"
import { generateYoloWords } from "@/lib/words/drill"
import { initializeWords } from "@/engine/typing-engine"
import type { YoloLetterProfile } from "@/types"
import { toast } from "sonner"
import { STREAK_MILESTONES } from "@/components/yolo/YoloToastBanner"
import { playAchievementSound } from "@/lib/audio"

let lastToastTimestamp = 0

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

export interface YoloToast {
  id: string
  icon: string
  title: string
  description: string
  category: string
  reward?: string
  type: "streak" | "confidence" | "rank" | "speed" | "mastery"
}

interface YoloState {
  activeLetter: string | null
  letterProfiles: Record<string, YoloLetterProfile>
  totalWordsCompleted: number
  streak: number
  sessionCount: number
  hasActiveRun: boolean
  sessionSummary: YoloSessionSummary

  // Actions
  initYoloRun: () => void
  startFresh: () => void
  addYoloToast: (toast: Omit<YoloToast, "id">) => void
  recordWordResult: (wasWordCorrect: boolean, currentAccuracy: number) => void
  updateActiveLetterStats: (
    keystrokes: { char: string; expectedChar: string; time: number; isCorrect: boolean }[],
    sessionWpm: number
  ) => void
  incrementWordsCompleted: (count: number) => void
  finishYoloSession: (wpm: number, accuracy: number, duration: number) => void
}

const initialSummary: YoloSessionSummary = {
  wordsCompleted: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
  startTime: null,
  lettersMasteredThisSession: [],
}

export function getLetterRank(confidence: number): string {
  if (confidence < 30) return "Novice"
  if (confidence < 50) return "Apprentice"
  if (confidence < 70) return "Adept"
  if (confidence < 85) return "Expert"
  if (confidence < 90) return "Master"
  return "Legendary"
}

export function getNextRankInfo(confidence: number): { nextRank: string; diff: number } | null {
  if (confidence < 30) return { nextRank: "Apprentice", diff: 30 - confidence }
  if (confidence < 50) return { nextRank: "Adept", diff: 50 - confidence }
  if (confidence < 70) return { nextRank: "Expert", diff: 70 - confidence }
  if (confidence < 85) return { nextRank: "Master", diff: 85 - confidence }
  if (confidence < 90) return { nextRank: "Legendary", diff: 90 - confidence }
  return null
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

      initYoloRun: () => {
        let currentActive = get().activeLetter
        let profiles = get().letterProfiles

        if (Object.keys(profiles).length === 0) {
          profiles = createDefaultProfiles()
        }

        if (!currentActive) {
          currentActive = getWeakestDrillLetter()
          if (profiles[currentActive] && profiles[currentActive].confidence >= 90) {
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
          streak: 0,
          sessionSummary: {
            ...initialSummary,
            startTime: Date.now(),
          },
        })
      },

      addYoloToast: (toastData) => {
        const settings = useSettingsStore.getState()
        if (!settings.achievementToasts) return

        const now = Date.now()
        if (now - lastToastTimestamp < 3000) return
        lastToastTimestamp = now

        if (settings.achievementSounds) {
          playAchievementSound()
        }

        toast.success(`${toastData.icon} ${toastData.title} — ${toastData.description}`, {
          duration: 2500,
        })
      },

      recordWordResult: (wasWordCorrect, currentAccuracy) => {
        const isYolo = useTypingStore.getState().config.mode === "yolo"
        const active = get().activeLetter

        const newStreak = wasWordCorrect ? get().streak + 1 : 0
        set({ streak: newStreak })

        // 1. Encourage streaks (milestones with custom styles) only if currentAccuracy >= 80
        if (currentAccuracy >= 80) {
          const milestone = STREAK_MILESTONES[newStreak]
          if (milestone) {
            get().addYoloToast({
              icon: milestone.icon,
              title: milestone.title,
              description: milestone.desc,
              category: "",
              type: "streak"
            })
          }
        }

        // 2. Letter switch at 15 back-to-back correct words (YOLO mode only!)
        if (isYolo && active && newStreak === 15) {
          const profiles = { ...get().letterProfiles }
          if (!profiles[active]) {
            profiles[active] = { letter: active, attempts: 0, correct: 0, avgReactionMs: 0, confidence: 0 }
          }
          profiles[active].confidence = 100 // Mark as fully mastered

          let newActive = active

          const currentIndex = YOLO_SEQUENCE.indexOf(active)
          const nextIndex = currentIndex + 1
          
          if (nextIndex < YOLO_SEQUENCE.length) {
            newActive = YOLO_SEQUENCE[nextIndex]
            
            while (nextIndex < YOLO_SEQUENCE.length && profiles[newActive] && profiles[newActive].confidence >= 90) {
              const nextLetterIdx = YOLO_SEQUENCE.indexOf(newActive) + 1
              if (nextLetterIdx < YOLO_SEQUENCE.length) {
                newActive = YOLO_SEQUENCE[nextLetterIdx]
              } else {
                break
              }
            }

            get().addYoloToast({
              icon: "🏆",
              title: `${active.toUpperCase()} Reached Legendary!`,
              description: `${active.toUpperCase()} mastered successfully`,
              category: "🏆 LETTER MASTERED",
              reward: `Next Focus: ${newActive.toUpperCase()}`,
              type: "mastery"
            })

            const currentMastered = get().sessionSummary.lettersMasteredThisSession
            if (!currentMastered.includes(active)) {
              set((s) => ({
                sessionSummary: {
                  ...s.sessionSummary,
                  lettersMasteredThisSession: [...currentMastered, active]
                }
              }))
            }

            // Regenerate future words immediately for the new active letter
            const typingStore = useTypingStore.getState()
            const activeWords = typingStore.words
            const currentIdx = typingStore.currentWordIndex
            
            const sliced = activeWords.slice(0, currentIdx + 1)
            const newWords = generateYoloWords(newActive, 25)
            const initializedNew = initializeWords(newWords)
            const lastIndex = sliced[sliced.length - 1]?.index ?? 0
            const mappedNew = initializedNew.map((w, idx) => ({
              ...w,
              index: lastIndex + 1 + idx
            }))
            typingStore.setWords([...sliced, ...mappedNew])
          }

          set({
            letterProfiles: profiles,
            activeLetter: newActive,
            streak: 0, // Reset streak for the new active letter
          })
        }
      },

      updateActiveLetterStats: (keystrokes, sessionWpm) => {
        const active = get().activeLetter
        if (!active) return

        const profiles = { ...get().letterProfiles }
        if (!profiles[active]) {
          profiles[active] = { letter: active, attempts: 0, correct: 0, avgReactionMs: 0, confidence: 0 }
        }

        const oldConfidence = profiles[active].confidence
        const oldRank = getLetterRank(oldConfidence)

        // 1. Update active letter stats
        const activeKeystrokes = keystrokes.filter(
          k => k.expectedChar.toLowerCase() === active
        )

        let totalAttempts = profiles[active].attempts
        let totalCorrect = profiles[active].correct
        let totalReaction = profiles[active].avgReactionMs * totalCorrect

        activeKeystrokes.forEach((k) => {
          totalAttempts++
          if (k.isCorrect) {
            totalCorrect++
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
        
        const finalConfidence = Math.min(100, Math.max(0, Math.round(accuracy * 0.7 + speedScore * 0.3)))
        profiles[active].confidence = finalConfidence

        const newRank = getLetterRank(finalConfidence)
        const confidenceGain = finalConfidence - oldConfidence

        // Trigger Live Feed toasts:
        // A. Mastery Gain Toast (if improved by 2%+)
        if (confidenceGain >= 2 && finalConfidence < 90) {
          get().addYoloToast({
            icon: "⚡",
            title: `${active.toUpperCase()} MASTERY UP`,
            description: `Letter mastery progress increased.`,
            category: "⚡ MASTERY UP",
            reward: `Mastery: ${oldConfidence}% → ${finalConfidence}%`,
            type: "confidence"
          })
        }

        // B. Rank Promotion Toast
        if (newRank !== oldRank && finalConfidence < 90) {
          get().addYoloToast({
            icon: "🏆",
            title: `${active.toUpperCase()} PROMOTED`,
            description: `${active.toUpperCase()} is now performing at ${newRank} level.`,
            category: "🚀 RANK UP",
            reward: `Rank: ${oldRank} → ${newRank}`,
            type: "rank"
          })
        }

        // C. Check for new best speed toast
        const historicalBestWpm = useStatsStore.getState().bestWpm
        if (sessionWpm > historicalBestWpm && historicalBestWpm > 0) {
          get().addYoloToast({
            icon: "🚀",
            title: "NEW SPEED RECORD",
            description: `${sessionWpm} WPM achieved.`,
            category: "⚡ NEW BEST",
            reward: `WPM: ${historicalBestWpm} → ${sessionWpm}`,
            type: "speed"
          })
        }

        // D. 2. Process mistakes on OTHER mastered letters
        const otherExpected = new Set(keystrokes.map(k => k.expectedChar.toLowerCase()))
        otherExpected.delete(active)

        otherExpected.forEach((char) => {
          if (!char || char.length !== 1 || !/^[a-z]$/.test(char)) return
          
          const profile = profiles[char]
          if (profile && profile.confidence >= 90) {
            const charKeystrokes = keystrokes.filter(k => k.expectedChar.toLowerCase() === char)
            const mistakes = charKeystrokes.filter(k => !k.isCorrect).length
            
            if (mistakes > 0) {
              // Mastered is mastered in V1/V2, capped at 90
              const newConfidence = Math.max(90, profile.confidence - (mistakes * 2))
              profile.confidence = newConfidence
            } else if (charKeystrokes.length > 0) {
              profile.confidence = Math.min(100, profile.confidence + 1)
            }
          }
        })

        set({
          letterProfiles: profiles,
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

      finishYoloSession: (wpm, accuracy, duration) => {
        const summary = get().sessionSummary
        
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
      partialize: (state) => ({
        activeLetter: state.activeLetter,
        letterProfiles: state.letterProfiles,
        totalWordsCompleted: state.totalWordsCompleted,
        streak: state.streak,
        sessionCount: state.sessionCount,
        hasActiveRun: state.hasActiveRun,
      }),
    }
  )
)
