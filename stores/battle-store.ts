import { create } from "zustand"
import type { BattleDifficulty, BattleState, BattleStatus } from "@/types"
import { AI_WPM_MAP } from "@/lib/constants"

interface BattleStore extends BattleState {
  initBattle: (difficulty: BattleDifficulty, wordCount?: number) => void
  setStatus: (status: BattleStatus) => void
  setPlayerProgress: (p: number) => void
  setAiProgress: (p: number) => void
  setWinner: (winner: "player" | "ai") => void
  resetBattle: () => void
}

const initialBattle: BattleState = {
  config: { difficulty: "easy", aiWpm: 35, wordCount: 25 },
  status: "racing",
  playerProgress: 0,
  aiProgress: 0,
  winner: null,
}

export const useBattleStore = create<BattleStore>((set) => ({
  ...initialBattle,

  initBattle: (difficulty, wordCount = 25) => {
    set({
      ...initialBattle,
      config: {
        difficulty,
        aiWpm: AI_WPM_MAP[difficulty],
        wordCount: wordCount as 25 | 50 | 75,
      },
      status: "racing",
    })
  },

  setStatus: (status) => set({ status }),
  setPlayerProgress: (p) => set({ playerProgress: p }),
  setAiProgress: (p) => set({ aiProgress: p }),
  setWinner: (winner) => set({ winner, status: "finished" }),
  resetBattle: () => set(initialBattle),
}))
