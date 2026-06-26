import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { useTypingStore } from "@/stores/typing-store"
import { useStatsStore } from "@/stores/stats-store"
import { useBattleStore } from "@/stores/battle-store"
import { useDrillStore } from "@/stores/drill-store"
import { useYoloStore } from "@/stores/yolo-store"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import { generateYoloWords } from "@/lib/words/drill"
import {
  processCharacter,
  processSpace,
  processBackspace,
  processWordDelete,
  isSessionComplete,
  countCorrectChars,
  initializeWords,
} from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId, computeSessionTimelineAndErrors } from "@/lib/utils"
import { playClickSound } from "@/lib/audio"

/**
 * Connects the active session's keyboard keystrokes to store mutations.
 * Exposes live WPM and Accuracy metrics.
 * 
 * Re-render optimization: reads keystroke-sensitive values directly from getState()
 * inside handlers to avoid re-creating the callback on every word/letter change.
 */
export function useTypingEngine() {
  // Only subscribe to values that are displayed in UI or needed for conditional logic in the hook itself
  const status = useTypingStore((s) => s.status)
  const config = useTypingStore((s) => s.config)
  const startTime = useTypingStore((s) => s.startTime)
  const endTime = useTypingStore((s) => s.endTime)

  // Store actions — stable references, won't cause re-renders
  const startSession = useTypingStore((s) => s.startSession)
  const finishSession = useTypingStore((s) => s.finishSession)
  const resetSession = useTypingStore((s) => s.resetSession)
  const setWords = useTypingStore((s) => s.setWords)
  const setCurrentWordIndex = useTypingStore((s) => s.setCurrentWordIndex)
  const setCurrentLetterIndex = useTypingStore((s) => s.setCurrentLetterIndex)
  const incrementCorrect = useTypingStore((s) => s.incrementCorrect)
  const incrementIncorrect = useTypingStore((s) => s.incrementIncorrect)
  const incrementTotal = useTypingStore((s) => s.incrementTotal)
  const logKeystroke = useTypingStore((s) => s.logKeystroke)

  const addResult = useStatsStore((s) => s.addResult)

  const keystrokesLogRef = useRef<{ char: string; expectedChar: string; time: number; isCorrect: boolean }[]>([])
  const recordedRef = useRef(false)

  useEffect(() => {
    if (status === "ready" || status === "idle") {
      keystrokesLogRef.current = []
      recordedRef.current = false
    }
  }, [status])

  useEffect(() => {
    if (status === "finished" && !recordedRef.current) {
      recordedRef.current = true
      useDrillStore.getState().recordSessionStats(
        keystrokesLogRef.current,
        startTime || Date.now()
      )
    }
  }, [status, startTime])

  // handleKeyDown reads all keystroke-sensitive state from getState() to avoid
  // recreating this callback every keystroke (words, currentWordIndex, currentLetterIndex
  // change on every keypress — would invalidate the callback 60+ times/minute)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const store = useTypingStore.getState()
      if (store.status === "finished") return

      const target = e.target as HTMLElement
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return

      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key !== "Backspace") return

      const key = e.key
      const { words, currentWordIndex, currentLetterIndex, status: currentStatus, config: currentConfig } = store

      // Ignore keystrokes during battle countdown
      if (currentConfig.mode === "battle") {
        const mpState = useMultiplayerStore.getState()
        if (mpState.activeRoomStatus === "countdown" || mpState.countdownRemaining !== null) {
          return
        }
      }

      // Tab or Escape triggers reset
      if (key === "Tab" || key === "Escape") {
        if (currentConfig.mode === "yolo" && currentStatus === "running") {
          finishSession()
          return
        }
        if (currentConfig.mode === "battle") {
          // Block resetting the session during a battle
          return
        }
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

        const expectedChar = words[currentWordIndex]?.letters[currentLetterIndex]?.char || ""

        const { words: nextWords, newLetterIndex, isCorrect } = processCharacter(
          words,
          currentWordIndex,
          currentLetterIndex,
          typed
        )

        if (currentStatus === "ready") {
          if (isCorrect) {
            startSession()
          } else {
            incrementIncorrect()
            setWords(nextWords)
            setCurrentLetterIndex(newLetterIndex)
            const kData = { char: typed, expectedChar, time: Date.now(), isCorrect: false }
            keystrokesLogRef.current.push(kData)
            logKeystroke(kData)
            return
          }
        }

        const kData = { char: typed, expectedChar, time: Date.now(), isCorrect }
        keystrokesLogRef.current.push(kData)
        logKeystroke(kData)

        if (isCorrect) {
          incrementCorrect()
        } else {
          incrementIncorrect()
        }

        setWords(nextWords)
        setCurrentLetterIndex(newLetterIndex)

        const isWordsOrBattleOrDrill = currentConfig.mode === "words" || currentConfig.mode === "battle" || currentConfig.mode === "drill"
        if (isWordsOrBattleOrDrill && isSessionComplete(nextWords, currentWordIndex)) {
          const finalCorrect = countCorrectChars(nextWords)
          const finalElapsed = Date.now() - (store.startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          // Read latest keystroke counts directly from store to get post-increment values
          const latestStore = useTypingStore.getState()
          const accVal = calculateAccuracy(latestStore.correctKeystrokes, latestStore.totalKeystrokes)
          const duration = finalElapsed / 1000

          const { timeline, errorKeys } = computeSessionTimelineAndErrors(
            latestStore.keystrokes,
            store.startTime || Date.now(),
            duration
          )

          addResult({
            id: generateId(),
            timestamp: Date.now(),
            config: currentConfig,
            wpm: wpmVal,
            accuracy: accVal,
            totalKeystrokes: latestStore.totalKeystrokes,
            correctKeystrokes: latestStore.correctKeystrokes,
            incorrectKeystrokes: latestStore.incorrectKeystrokes,
            duration,
            wordsCompleted: currentWordIndex + 1,
            timeline,
            errorKeys,
          })

          if (currentConfig.mode === "battle") {
            const battleState = useBattleStore.getState()
            battleState.setPlayerProgress(1.0)
            if (!battleState.winner) {
              battleState.setWinner("player")
            }
          }

          finishSession()
        }
        return
      }

      // Handle space key
      if (key === " ") {
        if (currentLetterIndex === 0) return
        playClickSound(key)

        // YOLO mode endless stream generator
        if (currentConfig.mode === "yolo") {
          const activeWords = useTypingStore.getState().words
          if (currentWordIndex + 5 >= activeWords.length) {
            const yoloStore = useYoloStore.getState()
            const activeLetter = yoloStore.activeLetter || "e"
            const newWords = generateYoloWords(activeLetter, 15) // append 15 more words
            const initializedNew = initializeWords(newWords)
            const lastIndex = activeWords[activeWords.length - 1].index
            const mappedNew = initializedNew.map((w, idx) => ({
              ...w,
              index: lastIndex + 1 + idx
            }))
            setWords([...activeWords, ...mappedNew])
          }
        }

        // Get the updated words array
        const updatedWords = useTypingStore.getState().words
        const spaceResult = processSpace(updatedWords, currentWordIndex)
        const battleState = useBattleStore.getState()

        if (spaceResult) {
          const { words: nextWords, newWordIndex, newLetterIndex } = spaceResult

          const spaceData = { char: " ", expectedChar: " ", time: Date.now(), isCorrect: true }
          keystrokesLogRef.current.push(spaceData)
          logKeystroke(spaceData)

          setWords(nextWords)
          setCurrentWordIndex(newWordIndex)
          setCurrentLetterIndex(newLetterIndex)
          incrementCorrect()

          // Record word results for streak milestones (all modes)
          const yoloStore = useYoloStore.getState()
          const completedWord = nextWords[currentWordIndex]
          const wasWordCorrect = completedWord && completedWord.state === "completed"
          
          const latestStore = useTypingStore.getState()
          const currentAcc = calculateAccuracy(latestStore.correctKeystrokes, latestStore.totalKeystrokes)
          
          yoloStore.recordWordResult(wasWordCorrect, currentAcc)

          // YOLO mode updates
          if (currentConfig.mode === "yolo") {
            yoloStore.incrementWordsCompleted(1)

            if (newWordIndex > 0 && newWordIndex % 20 === 0) {
              const elapsedMs = Date.now() - (store.startTime || Date.now())
              const correct = countCorrectChars(nextWords)
              const currentWpm = calculateWpm(correct, elapsedMs)
              yoloStore.updateActiveLetterStats(keystrokesLogRef.current, currentWpm)
            }
          }

          if (battleState.status === "racing") {
            const completedRatio = newWordIndex / battleState.config.wordCount
            battleState.setPlayerProgress(completedRatio)
          }
        } else {
          const finalCorrect = countCorrectChars(words)
          const finalElapsed = Date.now() - (store.startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const latestStore = useTypingStore.getState()
          const accVal = calculateAccuracy(latestStore.correctKeystrokes, latestStore.totalKeystrokes)
          const duration = finalElapsed / 1000

          const { timeline, errorKeys } = computeSessionTimelineAndErrors(
            latestStore.keystrokes,
            store.startTime || Date.now(),
            duration
          )

          addResult({
            id: generateId(),
            timestamp: Date.now(),
            config: currentConfig,
            wpm: wpmVal,
            accuracy: accVal,
            totalKeystrokes: latestStore.totalKeystrokes,
            correctKeystrokes: latestStore.correctKeystrokes,
            incorrectKeystrokes: latestStore.incorrectKeystrokes,
            duration,
            wordsCompleted: currentWordIndex + 1,
            timeline,
            errorKeys,
          })

          if (battleState.status === "racing") {
            battleState.setPlayerProgress(1.0)
            if (!battleState.winner) {
              battleState.setWinner("player")
            }
          }

          finishSession()
        }
        return
      }

      // Handle backspace key
      if (key === "Backspace") {
        playClickSound(key)
        const isWordDelete = e.ctrlKey || e.altKey || e.metaKey
        if (isWordDelete) {
          const { words: nextWords, newWordIndex, newLetterIndex } = processWordDelete(words, currentWordIndex, currentLetterIndex)
          setWords(nextWords)
          if (newWordIndex !== undefined) {
            setCurrentWordIndex(newWordIndex)
            const battleState = useBattleStore.getState()
            if (battleState.status === "racing") {
              const completedRatio = newWordIndex / battleState.config.wordCount
              battleState.setPlayerProgress(completedRatio)
            }
          }
          setCurrentLetterIndex(newLetterIndex)
        } else {
          const { words: nextWords, newWordIndex, newLetterIndex } = processBackspace(words, currentWordIndex, currentLetterIndex)
          setWords(nextWords)
          if (newWordIndex !== undefined) {
            setCurrentWordIndex(newWordIndex)
            const battleState = useBattleStore.getState()
            if (battleState.status === "racing") {
              const completedRatio = newWordIndex / battleState.config.wordCount
              battleState.setPlayerProgress(completedRatio)
            }
          }
          setCurrentLetterIndex(newLetterIndex)
        }
        incrementTotal()
        return
      }
    },
    // Only truly stable refs needed — all keystroke state read via getState()
    [startSession, finishSession, resetSession, setWords, setCurrentWordIndex, setCurrentLetterIndex, incrementCorrect, incrementIncorrect, incrementTotal, addResult]
  )

  // Live WPM — only recalculates on status change or every 500ms interval
  const [wpm, setWpm] = useState(0)
  const wordsRef = useRef(useTypingStore.getState().words)
  
  // Keep wordsRef in sync without triggering re-renders
  useEffect(() => {
    return useTypingStore.subscribe((s) => { wordsRef.current = s.words })
  }, [])

  useEffect(() => {
    if (status !== "running") {
      if (status === "finished" && startTime && endTime) {
        const correct = countCorrectChars(wordsRef.current)
        const elapsed = endTime - startTime
        requestAnimationFrame(() => setWpm(calculateWpm(correct, elapsed)))
      } else {
        requestAnimationFrame(() => setWpm(0))
      }
      return
    }

    const updateWpm = () => {
      const correct = countCorrectChars(wordsRef.current)
      const elapsed = Date.now() - (startTime || Date.now())
      setWpm(calculateWpm(correct, elapsed))
    }

    updateWpm()
    const interval = setInterval(updateWpm, 500)
    return () => clearInterval(interval)
  }, [status, startTime, endTime])

  // Live accuracy — read from store state directly, subscribe only to keystroke counts
  const correctKeystrokes = useTypingStore((s) => s.correctKeystrokes)
  const totalKeystrokes = useTypingStore((s) => s.totalKeystrokes)
  const accuracy = useMemo(
    () => calculateAccuracy(correctKeystrokes, totalKeystrokes),
    [correctKeystrokes, totalKeystrokes]
  )

  return { handleKeyDown, wpm, accuracy, isActive: status === "running" }
}
