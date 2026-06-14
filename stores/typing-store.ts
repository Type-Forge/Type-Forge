import { create } from "zustand"
import type { SessionConfig, SessionState, SessionStatus, WordData } from "@/types"
import { initializeWords } from "@/engine/typing-engine"
import { getRandomWords } from "@/lib/words"

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
    const wordCount = config.mode === "words"
      ? (config.wordCount ?? 25)
      : 200 // generate extra words for timed mode
    const rawWords = getRandomWords(wordCount)
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
      timeRemaining: config.mode === "timed" ? config.duration ?? 60 : null,
    })
  },

  startSession: () => {
    set({ status: "running", startTime: Date.now() })
  },

  handleKeyPress: (_key) => {
    // This is a thin setter. Actual processing handles inputs via hook useTypingEngine.
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
