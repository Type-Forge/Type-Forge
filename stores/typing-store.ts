import { create } from "zustand"
import type { SessionConfig, SessionState, SessionStatus, WordData, RawKeystroke } from "@/types"
import { initializeWords } from "@/engine/typing-engine"
import { getRandomWords } from "@/lib/words"
import { getBattleWords } from "@/lib/words/battle"
import { generateDrillText, calculateKeyWeakness, getWeaknessRatio } from "@/engine/drill-engine"
import { useDrillStore } from "./drill-store"
import { generateYoloWords } from "@/lib/words/drill"
import { useYoloStore } from "./yolo-store"
import { useSettingsStore } from "./settings-store"

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
  logKeystroke: (keystroke: RawKeystroke) => void
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
  keystrokes: [],
}

export const useTypingStore = create<TypingStore>((set, get) => ({
  ...initialState,

  initSession: (config) => {
    // Reset streak at the beginning of any session
    useYoloStore.setState({ streak: 0 })

    let rawWords: string[] = []

    if (config.mode === "drill") {
      const drillStore = useDrillStore.getState()
      let focusKeys = config.targetKeys ?? []
      let focusBigrams = config.targetBigrams ?? []

      // Calculate total session mistakes across all keys for advanced formula
      const totalIncorrectAllKeys = Object.values(drillStore.keyStats).reduce(
        (sum, s) => sum + s.totalIncorrect,
        0
      )

      // Automatically find worst keys/bigrams if not explicitly specified
      if (focusKeys.length === 0 && focusBigrams.length === 0) {
        const weakKeys = Object.values(drillStore.keyStats)
          .map(stats => ({
            stats,
            weakness: calculateKeyWeakness(stats, totalIncorrectAllKeys)
          }))
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
        const totalW = Object.values(drillStore.keyStats).reduce(
          (sum, stats) => sum + calculateKeyWeakness(stats, totalIncorrectAllKeys),
          0
        )
        averageWeakness = totalW / totalKeysWithStats
      }
      const weaknessRatio = getWeaknessRatio(averageWeakness)

      // In drill mode, we generate plenty of words to fill any timed duration or just keep typing
      const wordCount = config.targetDuration ? 150 : 35
      const activeDifficulty = useSettingsStore.getState().difficulty
      rawWords = generateDrillText({
        difficulty: activeDifficulty,
        focusKeys,
        focusBigrams,
        weaknessRatio,
        wordCount,
        keyStats: drillStore.keyStats,
        bigramStats: drillStore.bigramStats,
      })
    } else if (config.mode === "battle") {
      const wordCount = config.wordCount ?? 25
      rawWords = getBattleWords(wordCount, config.difficulty as "easy" | "medium" | "hard" | "veryhard")
    } else if (config.mode === "yolo") {
      const yoloStore = useYoloStore.getState()
      yoloStore.initYoloRun()
      const active = useYoloStore.getState().activeLetter || "e"
      rawWords = generateYoloWords(active, 25)
    } else {
      const wordCount = config.mode === "words"
        ? (config.wordCount ?? 25)
        : 200 // generate extra words for timed mode
      const textDifficulty = config.difficulty === "veryhard" ? "hard" : config.difficulty
      rawWords = getRandomWords(wordCount, textDifficulty)
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
  logKeystroke: (keystroke) => set((s) => ({
    keystrokes: [...s.keystrokes, keystroke]
  })),
}))
