import { useCallback, useMemo } from "react"
import { useTypingStore } from "@/stores/typing-store"
import { useStatsStore } from "@/stores/stats-store"
import { useBattleStore } from "@/stores/battle-store"
import {
  processCharacter,
  processSpace,
  processBackspace,
  isSessionComplete,
  countCorrectChars,
} from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"

/**
 * Connects the active session's keyboard keystrokes to store mutations.
 * Exposes live WPM and Accuracy metrics.
 */
export function useTypingEngine() {
  const {
    status,
    words,
    currentWordIndex,
    currentLetterIndex,
    startTime,
    endTime,
    totalKeystrokes,
    correctKeystrokes,
    incorrectKeystrokes,
    config,
    startSession,
    finishSession,
    resetSession,
    setWords,
    setCurrentWordIndex,
    setCurrentLetterIndex,
    incrementCorrect,
    incrementIncorrect,
    incrementTotal,
  } = useTypingStore()

  const addResult = useStatsStore((s) => s.addResult)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (status === "finished") return

      // Prevent modifier combos (like browser refresh, inspect, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key

      // Tab or Escape triggers reset
      if (key === "Tab" || key === "Escape") {
        resetSession()
        const battleState = useBattleStore.getState()
        if (battleState.status === "racing" || battleState.status === "finished") {
          battleState.resetBattle()
        }
        return
      }

      // Check if session needs to start on first keystroke
      if (status === "ready") {
        // If in battle mode, we only start typing if battle status is racing
        const battleState = useBattleStore.getState()
        if (battleState.status !== "selecting" && battleState.status !== "racing") {
          return // block typing during battle countdown
        }
        startSession()
      }

      // Handle character keystroke (a-z, A-Z)
      const isChar = key.length === 1 && /^[a-zA-Z]$/.test(key)
      if (isChar) {
        const typed = key.toLowerCase()
        const { words: nextWords, newLetterIndex, isCorrect } = processCharacter(
          words,
          currentWordIndex,
          currentLetterIndex,
          typed
        )

        // Increment store counts
        if (isCorrect) {
          incrementCorrect()
        } else {
          incrementIncorrect()
        }

        setWords(nextWords)
        setCurrentLetterIndex(newLetterIndex)

        // Sync with Battle Store progress if currently racing
        const battleState = useBattleStore.getState()
        if (battleState.status === "racing") {
          // If we completed the final letter of the final word
          if (isSessionComplete(nextWords, currentWordIndex)) {
            battleState.setPlayerProgress(1.0)
            if (!battleState.winner) {
              battleState.setWinner("player")
            }
            finishSession()
          }
        }

        // Check for session completion in normal words mode
        if (config.mode === "words" && battleState.status !== "racing" && isSessionComplete(nextWords, currentWordIndex)) {
          const finalWords = nextWords
          const finalCorrect = countCorrectChars(finalWords)
          const finalElapsed = Date.now() - (startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const accVal = calculateAccuracy(
            useTypingStore.getState().correctKeystrokes,
            useTypingStore.getState().totalKeystrokes
          )

          finishSession()

          addResult({
            id: generateId(),
            timestamp: Date.now(),
            config,
            wpm: wpmVal,
            accuracy: accVal,
            totalKeystrokes: useTypingStore.getState().totalKeystrokes,
            correctKeystrokes: useTypingStore.getState().correctKeystrokes,
            incorrectKeystrokes: useTypingStore.getState().incorrectKeystrokes,
            duration: finalElapsed / 1000,
            wordsCompleted: currentWordIndex + 1,
          })
        }
        return
      }

      // Handle space key
      if (key === " ") {
        const spaceResult = processSpace(words, currentWordIndex)
        const battleState = useBattleStore.getState()

        if (spaceResult) {
          const { words: nextWords, newWordIndex, newLetterIndex } = spaceResult
          setWords(nextWords)
          setCurrentWordIndex(newWordIndex)
          setCurrentLetterIndex(newLetterIndex)
          incrementTotal()

          // Sync battle mode progress
          if (battleState.status === "racing") {
            const completedRatio = newWordIndex / battleState.config.wordCount
            battleState.setPlayerProgress(completedRatio)
          }
        } else {
          // No more words left (end of standard words lists)
          const finalCorrect = countCorrectChars(words)
          const finalElapsed = Date.now() - (startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const accVal = calculateAccuracy(correctKeystrokes, totalKeystrokes)

          finishSession()

          if (battleState.status === "racing") {
            battleState.setPlayerProgress(1.0)
            if (!battleState.winner) {
              battleState.setWinner("player")
            }
          } else {
            addResult({
              id: generateId(),
              timestamp: Date.now(),
              config,
              wpm: wpmVal,
              accuracy: accVal,
              totalKeystrokes,
              correctKeystrokes,
              incorrectKeystrokes,
              duration: finalElapsed / 1000,
              wordsCompleted: currentWordIndex + 1,
            })
          }
        }
        return
      }

      // Handle backspace key
      if (key === "Backspace") {
        const { words: nextWords, newLetterIndex } = processBackspace(
          words,
          currentWordIndex,
          currentLetterIndex
        )
        setWords(nextWords)
        setCurrentLetterIndex(newLetterIndex)
        incrementTotal()
        return
      }
    },
    [
      status,
      words,
      currentWordIndex,
      currentLetterIndex,
      startTime,
      totalKeystrokes,
      correctKeystrokes,
      incorrectKeystrokes,
      config,
      startSession,
      finishSession,
      resetSession,
      setWords,
      setCurrentWordIndex,
      setCurrentLetterIndex,
      incrementCorrect,
      incrementIncorrect,
      incrementTotal,
      addResult,
    ]
  )

  // Calculate live WPM
  const wpm = useMemo(() => {
    if (status !== "running" && status !== "finished") return 0
    const correct = countCorrectChars(words)
    const elapsed = (endTime || Date.now()) - (startTime || Date.now())
    return calculateWpm(correct, elapsed)
  }, [words, status, startTime, endTime])

  // Calculate live accuracy
  const accuracy = useMemo(() => {
    return calculateAccuracy(correctKeystrokes, totalKeystrokes)
  }, [correctKeystrokes, totalKeystrokes])

  const isActive = status === "running"

  return {
    handleKeyDown,
    wpm,
    accuracy,
    isActive,
  }
}
