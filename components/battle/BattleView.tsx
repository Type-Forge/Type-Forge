"use client"

import { useEffect } from "react"
import { useTypingStore } from "@/stores/typing-store"
import { useBattleStore } from "@/stores/battle-store"
import { calculateAiProgressPerTick } from "@/engine/battle-engine"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useStatsStore } from "@/stores/stats-store"
import { countCorrectChars } from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"

/**
 * BattleView handles the opponent AI progress track.
 * Positioned below the typing area for absolute visual cleanliness.
 */
export default function BattleView() {
  const {
    status: battleStatus,
    config: battleConfig,
    playerProgress,
    aiProgress,
    winner,
    setAiProgress,
    setWinner,
  } = useBattleStore()

  const { wpm } = useTypingEngine()

  // Opponent AI progress calculation loops (100ms ticks)
  useEffect(() => {
    if (battleStatus !== "racing") return

    const tickMs = 100
    const interval = setInterval(() => {
      const typingStatus = useTypingStore.getState().status
      if (typingStatus !== "running") {
        return // AI waits until the player starts typing!
      }

      const state = useBattleStore.getState()
      const currentAi = state.aiProgress
      const currentPlayer = state.playerProgress
      const config = state.config

      if (currentAi >= 1.0) {
        clearInterval(interval)
        if (!state.winner) {
          setWinner("ai")
          const typingStore = useTypingStore.getState()

          // Log the battle session result where the player lost
          const finalWords = typingStore.words
          const finalCorrect = countCorrectChars(finalWords)
          const finalElapsed = Date.now() - (typingStore.startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const accVal = calculateAccuracy(
            typingStore.correctKeystrokes,
            typingStore.totalKeystrokes
          )

          useStatsStore.getState().addResult({
            id: generateId(),
            timestamp: Date.now(),
            config: typingStore.config,
            wpm: wpmVal,
            accuracy: accVal,
            totalKeystrokes: typingStore.totalKeystrokes,
            correctKeystrokes: typingStore.correctKeystrokes,
            incorrectKeystrokes: typingStore.incorrectKeystrokes,
            duration: finalElapsed / 1000,
            wordsCompleted: typingStore.currentWordIndex,
          })

          typingStore.setStatus("finished")
        }
        return
      }

      if (currentPlayer >= 1.0) {
        clearInterval(interval)
        return
      }

      const increment = calculateAiProgressPerTick(
        config.difficulty,
        config.wordCount,
        tickMs
      )
      setAiProgress(Math.min(currentAi + increment, 1.0))
    }, tickMs)

    return () => clearInterval(interval)
  }, [battleStatus, setAiProgress, setWinner])

  // BattleView handles AI logic only — no visual track rendered.
  // The AI is represented by the ghost caret inside the typing area.
  return null
}
