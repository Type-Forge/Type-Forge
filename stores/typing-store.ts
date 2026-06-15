import { create } from "zustand"
import type { SessionConfig, SessionState, SessionStatus, WordData } from "@/types"
import { initializeWords } from "@/engine/typing-engine"
import { getRandomWords } from "@/lib/words"
import { generateDrillText, calculateKeyWeakness, getWeaknessRatio } from "@/engine/drill-engine"
import { useDrillStore } from "./drill-store"

interface TypingStore extends SessionState {
  // Actions
  initSession: (config: SessionConfig) => void
  startSession: () => void
  handleKeyPress: (key: string) => void
  finishSession: () => void
  resetSession: () => void
  setTimeRemaining: (seconds: number) => void
  setWords: (words: WordData[]) => void
  setCurrentWordIndex: (index: number) => void
  setCurrentLetterIndex: (index: number) => void
  setStatus: (status: SessionStatus) => void
  incrementCorrect: () => void
  incrementIncorrect: () => void
  incrementTotal: () => void
}

const initialState: SessionState = {
  config: { mode: "words", wordCount: 25 },
  status: "idle",
  words: [],
  currentWordIndex: 0,
  currentLetterIndex: 0,
  startTime: null,
  endTime: null,
  timeRemaining: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
}

export const useTypingStore = create<TypingStore>((set, get) => ({
  ...initialState,

  initSession: (config) => {
    let rawWords: string[] = []

    if (config.mode === "drill") {
      const drillStore = useDrillStore.getState()
      let focusKeys = config.targetKeys ?? []
      let focusBigrams = config.targetBigrams ?? []

      // Automatically find worst keys/bigrams if not explicitly specified (i.e. not custom/suggested)
      if (focusKeys.length === 0 && focusBigrams.length === 0) {
        const weakKeys = Object.values(drillStore.keyStats)
          .map(stats => ({ stats, weakness: calculateKeyWeakness(stats) }))
          .filter(item => item.weakness > 15)
          .sort((a, b) => b.weakness - a.weakness)
          .slice(0, 3)
          .map(item => item.stats.key)

        focusKeys = weakKeys
      }

      // Calculate weakness ratio
      const totalKeysWithStats = Object.keys(drillStore.keyStats).length
      let averageWeakness = 0
      if (totalKeysWithStats > 0) {
        const totalW = Object.values(drillStore.keyStats).reduce((sum, stats) => sum + calculateKeyWeakness(stats), 0)
        averageWeakness = totalW / totalKeysWithStats
      }
      const weaknessRatio = getWeaknessRatio(averageWeakness)

      // In drill mode, we generate plenty of words to fill any timed duration or just keep typing
      const wordCount = config.targetDuration ? 150 : 35
      rawWords = generateDrillText({
        difficulty: config.difficulty ?? "easy",
        focusKeys,
        focusBigrams,
        weaknessRatio,
        wordCount,
      })
    } else {
      const wordCount = (config.mode === "words" || config.mode === "battle")
        ? (config.wordCount ?? 25)
        : 200 // generate extra words for timed mode
      rawWords = getRandomWords(wordCount)
    }

    const words = initializeWords(rawWords)
    
    // Mark first word as active
    if (words.length > 0) {
      words[0].state = "active"
      if (words[0].letters.length > 0) {
        words[0].letters[0].state = "active"
      }
    }
    set({
      ...initialState,
      config,
      status: "ready",
      words,
      timeRemaining: config.mode === "timed"
        ? (config.duration ?? 60)
        : (config.mode === "drill" && config.targetDuration)
        ? config.targetDuration
        : null,
    })
  },

  startSession: () => {
    set({ status: "running", startTime: Date.now() })
  },

  handleKeyPress: (_key) => {
    // This is a thin setter. Actual processing handles inputs via hook useTypingEngine.
    void _key
  },

  finishSession: () => {
    set({ status: "finished", endTime: Date.now() })
  },

  resetSession: () => {
    const { config } = get()
    get().initSession(config)
  },

  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  setWords: (words) => set({ words }),
  setCurrentWordIndex: (index) => set({ currentWordIndex: index }),
  setCurrentLetterIndex: (index) => set({ currentLetterIndex: index }),
  setStatus: (status) => set({ status }),
  incrementCorrect: () => set((s) => ({
    correctKeystrokes: s.correctKeystrokes + 1,
    totalKeystrokes: s.totalKeystrokes + 1,
  })),
  incrementIncorrect: () => set((s) => ({
    incorrectKeystrokes: s.incorrectKeystrokes + 1,
    totalKeystrokes: s.totalKeystrokes + 1,
  })),
  incrementTotal: () => set((s) => ({
    totalKeystrokes: s.totalKeystrokes + 1,
  })),
}))
