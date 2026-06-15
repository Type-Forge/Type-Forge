import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { KeyStats, BigramStats, TrigramStats, MistakeRecord, DrillHistoryEntry, SessionConfig } from "@/types"

interface RawKeystroke {
  char: string
  expectedChar: string
  time: number
  isCorrect: boolean
}

interface DrillStore {
  keyStats: Record<string, KeyStats>
  bigramStats: Record<string, BigramStats>
  trigramStats: Record<string, TrigramStats>
  mistakeRecords: MistakeRecord[]
  drillHistory: DrillHistoryEntry[]
  
  recordSessionStats: (keystrokes: RawKeystroke[], sessionStartTime: number) => void
  addDrillHistory: (entry: DrillHistoryEntry) => void
  resetStats: () => void
}

const initialDrillState = {
  keyStats: {},
  bigramStats: {},
  trigramStats: {},
  mistakeRecords: [],
  drillHistory: [],
}

export const useDrillStore = create<DrillStore>()(
  persist(
    (set, get) => ({
      ...initialDrillState,

      recordSessionStats: (keystrokes, sessionStartTime) => {
        if (!keystrokes || keystrokes.length === 0) return

        const updatedKeyStats = { ...get().keyStats }
        const updatedBigramStats = { ...get().bigramStats }
        const updatedTrigramStats = { ...get().trigramStats }
        let updatedMistakeRecords = [...get().mistakeRecords]

        // Track consecutive incorrect strokes per key in this session
        const sessionConsecutiveErrors: Record<string, number> = {}
        const sessionMaxConsecutive: Record<string, number> = {}

        keystrokes.forEach((k) => {
          const expected = k.expectedChar.toLowerCase()
          if (!expected || expected.length !== 1 || !/^[a-z ]$/.test(expected)) return

          if (!sessionConsecutiveErrors[expected]) {
            sessionConsecutiveErrors[expected] = 0
            sessionMaxConsecutive[expected] = 0
          }

          if (!k.isCorrect) {
            sessionConsecutiveErrors[expected]++
            sessionMaxConsecutive[expected] = Math.max(
              sessionMaxConsecutive[expected],
              sessionConsecutiveErrors[expected]
            )
          } else {
            sessionConsecutiveErrors[expected] = 0
          }
        })

        // 1. Process Single Key Statistics & Mistake Records (with Swap Detection)
        for (let idx = 0; idx < keystrokes.length; idx++) {
          const k = keystrokes[idx]
          const expected = k.expectedChar.toLowerCase()
          if (!expected || expected.length !== 1 || !/^[a-z ]$/.test(expected)) continue

          // Initialize if needed
          if (!updatedKeyStats[expected]) {
            updatedKeyStats[expected] = {
              key: expected,
              totalAttempts: 0,
              totalCorrect: 0,
              totalIncorrect: 0,
              totalReactionTime: 0,
              averageReactionTime: 0,
              maxConsecutiveMistakes: 0,
            }
          }

          const stats = updatedKeyStats[expected]
          stats.totalAttempts += 1
          stats.maxConsecutiveMistakes = Math.max(
            stats.maxConsecutiveMistakes || 0,
            sessionMaxConsecutive[expected] || 0
          )

          if (k.isCorrect) {
            stats.totalCorrect += 1
            // Calculate reaction time: since last key or since session start
            const prevTime = idx === 0 ? sessionStartTime : keystrokes[idx - 1].time
            const rt = Math.max(0, k.time - prevTime)
            
            // Filter out unreasonably high reaction times (e.g. pauses > 3s)
            if (rt < 3000) {
              stats.totalReactionTime += rt
              stats.averageReactionTime = Math.round(stats.totalReactionTime / stats.totalCorrect)
            }
          } else {
            stats.totalIncorrect += 1
            
            // Check for adjacent swap mistake (e.g. expected th -> typed ht)
            let isSwap = false
            if (idx < keystrokes.length - 1) {
              const nextK = keystrokes[idx + 1]
              if (!nextK.isCorrect) {
                const exp1 = expected
                const act1 = k.char.toLowerCase()
                const exp2 = nextK.expectedChar.toLowerCase()
                const act2 = nextK.char.toLowerCase()

                if (exp1 === act2 && act1 === exp2 && exp1 !== exp2 && /^[a-z ]$/.test(exp1) && /^[a-z ]$/.test(exp2)) {
                  updatedMistakeRecords.push({
                    expected: exp1 + exp2,
                    actual: act1 + act2,
                    timestamp: Date.now(),
                  })
                  isSwap = true
                  idx++ // skip the next key as it is part of this swap
                }
              }
            }

            if (!isSwap) {
              // Save Single Character Mistake Record
              updatedMistakeRecords.push({
                expected,
                actual: k.char.toLowerCase(),
                timestamp: Date.now(),
              })
            }
          }
        }

        // Limit mistake records to last 150 entries to prevent memory bloat
        if (updatedMistakeRecords.length > 150) {
          updatedMistakeRecords = updatedMistakeRecords.slice(-150)
        }

        // 2. Process Bigram Statistics (Adjacent Pairs)
        for (let i = 0; i < keystrokes.length - 1; i++) {
          const k1 = keystrokes[i]
          const k2 = keystrokes[i + 1]

          const char1 = k1.expectedChar.toLowerCase()
          const char2 = k2.expectedChar.toLowerCase()

          // Only track basic pairs (letters or spaces)
          if (!/^[a-z ]$/.test(char1) || !/^[a-z ]$/.test(char2)) continue
          const pair = char1 + char2

          if (!updatedBigramStats[pair]) {
            updatedBigramStats[pair] = {
              pair,
              attempts: 0,
              mistakes: 0,
              averageTransitionTime: 0,
            }
          }

          const bStats = updatedBigramStats[pair]
          bStats.attempts += 1

          if (!k2.isCorrect) {
            bStats.mistakes += 1
          } else if (k1.isCorrect) {
            const transition = Math.max(0, k2.time - k1.time)
            if (transition < 3000) {
              const successfulAttempts = bStats.attempts - bStats.mistakes
              const totalTime = bStats.averageTransitionTime * (successfulAttempts - 1) + transition
              bStats.averageTransitionTime = Math.round(totalTime / Math.max(1, successfulAttempts))
            }
          }
        }

        // 3. Process Trigram Statistics (Adjacent Triplets)
        for (let i = 0; i < keystrokes.length - 2; i++) {
          const k1 = keystrokes[i]
          const k2 = keystrokes[i + 1]
          const k3 = keystrokes[i + 2]

          const char1 = k1.expectedChar.toLowerCase()
          const char2 = k2.expectedChar.toLowerCase()
          const char3 = k3.expectedChar.toLowerCase()

          if (!/^[a-z ]$/.test(char1) || !/^[a-z ]$/.test(char2) || !/^[a-z ]$/.test(char3)) continue
          const sequence = char1 + char2 + char3

          if (!updatedTrigramStats[sequence]) {
            updatedTrigramStats[sequence] = {
              sequence,
              attempts: 0,
              mistakes: 0,
              averageTransitionTime: 0,
            }
          }

          const tStats = updatedTrigramStats[sequence]
          tStats.attempts += 1

          if (!k3.isCorrect || !k2.isCorrect) {
            tStats.mistakes += 1
          } else if (k1.isCorrect) {
            const transition = Math.max(0, k3.time - k1.time)
            if (transition < 4000) {
              const successfulAttempts = tStats.attempts - tStats.mistakes
              const totalTime = tStats.averageTransitionTime * (successfulAttempts - 1) + transition
              tStats.averageTransitionTime = Math.round(totalTime / Math.max(1, successfulAttempts))
            }
          }
        }

        set({
          keyStats: updatedKeyStats,
          bigramStats: updatedBigramStats,
          trigramStats: updatedTrigramStats,
          mistakeRecords: updatedMistakeRecords,
        })
      },

      addDrillHistory: (entry) => {
        set((state) => ({
          drillHistory: [entry, ...state.drillHistory].slice(0, 50),
        }))
      },

      resetStats: () => set(initialDrillState),
    }),
    { name: "turing-type-drills" }
  )
)
