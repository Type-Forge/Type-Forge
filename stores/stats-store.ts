import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SessionResult, StatsState } from "@/types"
import { MAX_HISTORY_LENGTH } from "@/lib/constants"
import { saveSessionResult } from "@/app/actions/session"

interface StatsStore extends StatsState {
  addResult: (result: SessionResult) => void
  clearHistory: () => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      history: [],
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 100,

      addResult: (result) => {
        const history = [result, ...get().history].slice(0, MAX_HISTORY_LENGTH)
        const bestWpm = Math.max(get().bestWpm, result.wpm)
        const averageWpm = history.length > 0 
          ? Math.round(history.reduce((sum, r) => sum + r.wpm, 0) / history.length)
          : 0
        const averageAccuracy = history.length > 0 
          ? Math.round(history.reduce((sum, r) => sum + r.accuracy, 0) / history.length)
          : 100
        set({ history, bestWpm, averageWpm, averageAccuracy })

        // Asynchronously sync results to PostgreSQL if authenticated
        saveSessionResult({
          wpm: result.wpm,
          accuracy: result.accuracy,
          totalKeystrokes: result.totalKeystrokes,
          correctKeystrokes: result.correctKeystrokes,
          incorrectKeystrokes: result.incorrectKeystrokes,
          duration: result.duration,
          wordsCompleted: result.wordsCompleted,
          mode: result.config.mode,
          config: result.config,
          timeline: result.timeline || [],
          errorKeys: result.errorKeys || null,
        }).catch((err) => console.error("Failed to sync result to database:", err))
      },

      clearHistory: () => set({
        history: [],
        bestWpm: 0,
        averageWpm: 0,
        averageAccuracy: 100,
      }),
    }),
    { name: "turing-type-stats" }
  )
)
