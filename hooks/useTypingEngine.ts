import { useCallback, useMemo, useState, useEffect } from "react"
import { useTypingStore } from "@/stores/typing-store"
import { useStatsStore } from "@/stores/stats-store"
import { useBattleStore } from "@/stores/battle-store"
import {
  processCharacter,
  processSpace,
  processBackspace,
  processWordDelete,
  isSessionComplete,
  countCorrectChars,
} from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"
import { playClickSound } from "@/lib/audio"

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

      // Prevent modifier combos (like browser refresh, inspect, etc.), EXCEPT Backspace
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key !== "Backspace") return

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

      // Handle character keystroke (a-z, A-Z)
      const isChar = key.length === 1 && /^[a-zA-Z]$/.test(key)
      if (isChar) {
        playClickSound(key)
        const typed = key.toLowerCase()

        // Block typing during battle countdown
        const battleState = useBattleStore.getState()
        if (status === "ready" && battleState.status !== "selecting" && battleState.status !== "racing") {
          return
        }

        const { words: nextWords, newLetterIndex, isCorrect } = processCharacter(
          words,
          currentWordIndex,
          currentLetterIndex,
          typed
        )

        // Only start session if status is ready and key is correct
        if (status === "ready") {
          if (isCorrect) {
            startSession()
          } else {
            // Incorrect first character: mark it incorrect, increment incorrect count, but don't start the session
            incrementIncorrect()
            setWords(nextWords)
            setCurrentLetterIndex(newLetterIndex)
            return
          }
        }

        // Increment store counts
        if (isCorrect) {
          incrementCorrect()
        } else {
          incrementIncorrect()
        }

        setWords(nextWords)
        setCurrentLetterIndex(newLetterIndex)

        // Check for session completion in normal words mode or battle mode
        const isWordsOrBattle = config.mode === "words" || config.mode === "battle"
        if (isWordsOrBattle && isSessionComplete(nextWords, currentWordIndex)) {
          const finalWords = nextWords
          const finalCorrect = countCorrectChars(finalWords)
          const finalElapsed = Date.now() - (startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const accVal = calculateAccuracy(
            useTypingStore.getState().correctKeystrokes,
            useTypingStore.getState().totalKeystrokes
          )

          finishSession()

          if (config.mode === "battle") {
            const battleState = useBattleStore.getState()
            battleState.setPlayerProgress(1.0)
            if (!battleState.winner) {
              battleState.setWinner("player")
            }
          }

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
        if (currentLetterIndex === 0) return
        playClickSound(key)
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
          }

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
        return
      }

      // Handle backspace key
      if (key === "Backspace") {
        playClickSound(key)
        const isWordDelete = e.ctrlKey || e.altKey || e.metaKey
        if (isWordDelete) {
          const { words: nextWords, newLetterIndex } = processWordDelete(
            words,
            currentWordIndex
          )
          setWords(nextWords)
          setCurrentLetterIndex(newLetterIndex)
        } else {
          const { words: nextWords, newLetterIndex } = processBackspace(
            words,
            currentWordIndex,
            currentLetterIndex
          )
          setWords(nextWords)
          setCurrentLetterIndex(newLetterIndex)
        }
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

  // Calculate live WPM state via a side effect (avoiding Date.now in render)
  const [wpm, setWpm] = useState(0)

  useEffect(() => {
    if (status !== "running") {
      if (status === "finished" && startTime && endTime) {
        const correct = countCorrectChars(words)
        const elapsed = endTime - startTime
        requestAnimationFrame(() => {
          setWpm(calculateWpm(correct, elapsed))
        })
      } else {
        requestAnimationFrame(() => {
          setWpm(0)
        })
      }
      return
    }

    const updateWpm = () => {
      const correct = countCorrectChars(words)
      const elapsed = Date.now() - (startTime || Date.now())
      setWpm(calculateWpm(correct, elapsed))
    }

    updateWpm()
    const interval = setInterval(updateWpm, 500)
    return () => clearInterval(interval)
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
